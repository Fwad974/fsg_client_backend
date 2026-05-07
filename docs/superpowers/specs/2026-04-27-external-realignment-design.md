# External Backend Realignment — Design

**Date:** 2026-04-27
**Status:** Draft
**Scope covers:** sub-projects 1 (model + auth realignment) and 3 (external read APIs) merged. Sub-projects 2 (internal-side M2M backfill) and 4 (TestCategory data load) live in separate specs.

---

## Summary

Rebuild `fsg_client_backend` (the external API) so it acts as a **read-aligned consumer of the shared internal Postgres database**. Drop the legacy `Corporate` / `Individual` / `Clinic` / `Category` model abstractions; align external's models, repositories, AJV schemas, services, controllers, and routes to the internal schema as the single source of truth.

Outcomes:
- Login (`POST /user/login`) accepts a 3-value `accountType` (`corporate | patient | doctor`) and authenticates against the shared `users` + `user_roles` tables seeded by internal.
- A new download endpoint (`GET /reports/download?docInstanceUuid=...`) accessible to all three account types serves PDFs from the shared `./downloads/` Docker volume, with per-account-type ownership enforced inline in the SQL query (defense-in-depth alongside the existing `checkPermission` middleware).
- New read endpoints (`/corporate/{patients,patient-report,test-catalog}`, `/doctor/{patients,patient-report,test-catalog}`, `/patient/report-status`) return scoped data per account type.
- Internal schema gains 3 NOT-NULL flips (`form_requests.doctor_id`, `test_results.hospital_id`, `test_results.doctor_id`) and 5 new TestCategory columns. Seeds are renamed to use the external public vocabulary (`CORPORATE` instead of `HOSPITAL` for `user_roles`; `account_type` instead of `user_type` on `users`).

---

## Motivation

The external backend was built before the internal one and uses a different vocabulary (`Individual`, `Corporate`, `Clinic`, `Category`). Now that the internal backend has stabilized as the system's source of truth — owning the LIMS workflow, the patient registration flow, and PDF generation — the external API should consume the same database and the same model shapes. Maintaining two parallel data models is costly and the divergence has already caused download bugs.

This spec is the foundation step: get the model, auth, and download flows right against the shared DB; rebuild the external GET APIs on top of that foundation; and remove dead legacy code.

---

## Scope

### In scope
- Drop external's old model files: `corporate.model.js`, `individual.model.js`, `clinic.model.js`, `category.model.js`.
- Add/align external's model files for the subset of internal tables external reads (`User`, `UserRole`, `Patient`, `Hospital`, `Doctor`, `TestResult`, `FormRequest`, `DocInstance`, `TestCategory`, plus housekeeping like `UserToken`, `ContactRequest`).
- Internal schema flips: `form_requests.doctor_id`, `test_results.hospital_id`, `test_results.doctor_id` to NOT NULL.
- Internal new columns on `test_categories`: `test_sub_category`, `finance_department`, `outsource_lab_test_code`, `storage_stability`, `client_tat`.
- Internal column rename: `users.user_type` → `users.account_type`.
- Internal seed updates: `user_roles` renamed to external vocabulary (`CORPORATE`, `PATIENT`, `DOCTOR`, `PAYMENT`); `PATIENT` role gets `REPORTS:['R']` permission for download access.
- External `src/libs/permissions.js` aligned to internal-seeded vocabulary.
- External login refactored: 3-value `accountType` DTO, role-type filter, drop OTP gate, validate-account-link sub-service.
- New `GET /reports/download` endpoint (single route, all 3 account types).
- New read endpoints with role-prefixed routes (corporate/doctor/patient).
- Manual smoke tests via curl + log inspection. Test framework setup deferred.

### Out of scope
- **Sub-project 2** — internal-side M2M backfill of `patient_doctors` / `patient_hospitals` on `submitFormRequest`. (Separate spec.)
- **Sub-project 4** — actually loading the TestCategory JSON data. (Schema additions land here; data load runs after.)
- Dashboard endpoint redesign (`/dashboard/*`).
- Payment role's full API contract (download access falls out of permission shape; rest deferred).
- External services in `payment/`, `transactions/`, `demo/`, `dashboard/` — left untouched if they don't import dropped models; deleted if they do.
- Any change to PDF generation in internal (paths, file format, naming).
- Frontend changes (separate work item).

---

## Design

### Topology

```
                         ┌──────────────────────┐
                         │   shared Postgres    │
                         │  (internal-owned     │
                         │   schema + seeds)    │
                         └─┬────────────────┬───┘
                           │                │
              ┌────────────┴───┐    ┌───────┴────────┐
              │  internal app  │    │  external app  │
              │  (writes)      │    │  (reads + auth)│
              └────────────────┘    └────────────────┘
                           shared filesystem volume
                           ./downloads/*.pdf
```

Both apps share the same `users`, `user_roles`, `patients`, `hospitals`, `doctors`, `test_results`, `form_requests`, `doc_instances`, `test_categories`. Internal owns migrations + seeds. External re-declares model files for the subset of tables it queries — exact-shape redeclaration, no schema authority. PDFs live in a shared `./downloads/` Docker volume mount, resolved via `path.join(process.cwd(), pdfFilePath)` with a path-traversal guard, identical to internal.

### Vocabulary boundary

Two parallel vocabularies coexist by design:

| Concept | Naming | Notes |
|---|---|---|
| Entity model class | `Hospital`, `Patient`, `Doctor` | Matches internal model names |
| DB table names | `hospitals`, `patients`, `doctors` | Matches internal |
| FK columns on `users` | `hospital_id`, `patient_id`, `doctor_id` | Matches table names |
| `users.account_type` | `corporate` \| `patient` \| `doctor` | External public vocab; lowercase |
| `user_roles.role_type` | `CORPORATE` \| `PATIENT` \| `DOCTOR` \| `PAYMENT` | External public vocab; uppercase |
| `user_roles.name` | `FSG:CORPORATE`, `FSG:PATIENT`, etc. | External public vocab |
| `user_roles.permission` modules | `CORPORATE`, `PATIENT`, `DOCTOR`, `PAYMENT`, `REPORTS` | External public vocab |
| External route prefixes | `/corporate/*`, `/doctor/*`, `/patient/*` | External public vocab |
| External service folders | `services/corporate/` etc. (where applicable) | External public vocab |

Rule of thumb: anything that names a *thing* (tables, models, FKs to those tables) keeps the internal vocabulary (`hospital`). Anything that names an *account / role / permission / public surface* uses the external vocabulary (`corporate`).

A `corporate` account always has `hospital_id` set (the FK to a real hospital row); the row's role determines whether they're a `CORPORATE` admin or a `PAYMENT` user under that hospital.

### Layered refactor execution order

The implementation plan executes bottom-up, each layer touched only once:

1. **DB layer** — schema flips on internal; drop external's old model files; add/align external's model files; refactor external repositories; new TestCategory columns inline.
2. **AJV layer** — request/response schemas updated to new field names.
3. **Service layer** — refactored `login`; new `downloadReport`, `getMyPatients`, `getPatientReport`, `getTestCatalog`, `getMyReportStatus`; new `validateUserAccountLink`; new `resolveOwnerScope` helper.
4. **Controller layer** — thin handlers wired to new services using the existing `sendResponse` pattern.
5. **Route layer** — role-prefixed routes; single shared `/reports/download`; `checkPermission` middleware on every route; deletion of `fileAuthorization.middleware.js`.

### DB schema changes (internal)

#### `form_requests`
- `doctor_id`: nullable → **NOT NULL**.

#### `test_results`
- `hospital_id`: nullable → **NOT NULL**.
- `doctor_id`: nullable → **NOT NULL**.

#### `test_categories` — add 5 columns (all `STRING`, nullable)
- `test_sub_category`
- `finance_department`
- `outsource_lab_test_code`
- `storage_stability`
- `client_tat`

#### `users` — column rename
- `user_type` → `account_type`. (Rename column in migration, model, every reference.)

Per `claude.md` rule: edit existing migrations to add/modify columns. Provide manual `ALTER TABLE` SQL for local DB sync, prefixed by a backfill `UPDATE` that copies values from `form_requests` for any NULL rows so the NOT NULL constraint can be applied without violation.

#### Internal seeds
- `20251006185710-add-roles-to-user-role.js`: rename roles to external vocab.
  ```js
  { id:1, name:'FSG:PATIENT',   role_type:'PATIENT',
    permission: { PATIENT:['R'], REPORTS:['R'] } }
  { id:2, name:'FSG:CORPORATE', role_type:'CORPORATE',
    permission: { CORPORATE:['R'], REPORTS:['R'] } }
  { id:3, name:'FSG:DOCTOR',    role_type:'DOCTOR',
    permission: { DOCTOR:['R'], REPORTS:['R'] } }
  { id:4, name:'FSG:PAYMENT',   role_type:'PAYMENT',
    permission: { PAYMENT:['R'], REPORTS:['R'], TRANSACTION:['R'] } }
  ```
- `20251010100001-adding-users.js`: any `user_type:'hospital'` becomes `account_type:'corporate'`. Same column rename downstream.
- Manual data-migration SQL to be supplied for any environment where the seed already ran with old vocabulary.

### DB schema changes (external)

External owns no migrations. Model files are added/dropped/aligned to mirror internal's schema for the subset of tables read. Detail in §Files Modified.

### Authentication flow

**`POST /user/login`** — refactored from existing.

Request DTO:
```json
{
  "userNameOrPhone": "string",
  "password": "string",
  "accountType": "corporate" | "patient" | "doctor"
}
```

Service flow:

```
LoginService.run()
  1. Map accountType → user_roles.role_type candidates:
       'corporate' → ['CORPORATE', 'PAYMENT']     (a corporate-account user
                                                    can hold either role)
       'patient'   → ['PATIENT']
       'doctor'    → ['DOCTOR']
  2. UserRepository.findByUserNameOrPhoneWithRoleIn(userNameOrPhone, roleTypes)
       SELECT u.*, r.* FROM users u
       JOIN user_roles r ON r.id = u.user_role_id
       WHERE r.role_type IN (...) AND (u.user_name = ? OR u.phone = ?)
  3. If !user                  → addError('UserNotExistsErrorType')
  4. If !user.encryptedPassword → addError('PasswordExpiredErrorType')
  5. bcrypt.compare(password, user.encryptedPassword)
       false → addError('InvalidCredentialsErrorType')
       (Note: the previous OTP/phoneVerified gate is intentionally
        removed — phone verification no longer blocks login. The
        phone/generateCode services remain in the codebase for
        possible future use; just unwired from login.)
  6. ValidateUserAccountLinkService.run({ user })
       resolves the FK based on accountType, calls the right repo,
       confirms the linked entity row exists.
       returns { column, id }  OR
       errors: AccountNotLinkedErrorType (FK is null)
             | AccountLinkBrokenErrorType (FK points to deleted entity)
  7. Update user: signInCount += 1, lastLogin = now
  8. JWT.sign({ id, phone }, JWT_LOGIN_SECRET, expiry)
       (claim shape unchanged from existing login)
  9. Redis.setex(getUserTokenCacheKey(user.id), expiry, accessToken)
 10. Return { message, accessToken, user }
```

Per-request: trust the JWT for the session lifetime. Don't re-verify the FK exists on every request — Stripe / GitHub pattern. The lightweight `resolveOwnerScope` (`hospitalId` non-null) check still runs in scoped services as defense-in-depth, but it doesn't hit the DB.

### Permission middleware (`checkPermission`) integration

The existing `src/rest-resources/middlewares/checkPermission.middleware.js` is reused as-is. It maps endpoint path → module via `PERMISSION_TYPE.aliases`, looks up the user's `role.permission` JSONB, and rejects if the action isn't permitted.

**Replace `src/libs/permissions.js`** with the externally-aligned vocabulary:

```js
export const REQUEST_TYPE = {
  GET: 'R', POST: 'C', PUT: 'U', PATCH: 'U', DELETE: 'D', TOGGLE: 'T'
}

export const PERMISSION_TYPE = {
  CORPORATE: 'CORPORATE',
  DOCTOR:    'DOCTOR',
  PATIENT:   'PATIENT',
  PAYMENT:   'PAYMENT',
  REPORTS:   'REPORTS',

  aliases: {
    'corporate/patients':       'CORPORATE',
    'corporate/patient-report': 'REPORTS',
    'corporate/test-catalog':   'CORPORATE',

    'doctor/patients':       'DOCTOR',
    'doctor/patient-report': 'REPORTS',
    'doctor/test-catalog':   'DOCTOR',

    'patient/report-status': 'PATIENT',

    'reports/download':      'REPORTS'
  }
}

export const PERMISSIONS = {
  CORPORATE: ['R'], DOCTOR: ['R'], PATIENT: ['R'],
  PAYMENT:   ['R'], REPORTS: ['R']
}
```

The legacy `COPORATE` typo, `INDIVIDUAL`, `TRANSACTION`, and the dashboard-related aliases are removed (those endpoints are being deleted or deferred).

### Download flow

**`GET /reports/download?docInstanceUuid=<uuid>`** — single route, all three account types.

Middleware chain (in order):
```
contextMiddleware
authenticationMiddleware
  → sets req.context.user = { id, accountType,
                              hospitalId|doctorId|patientId,
                              role: { roleType, permission } }
checkPermission                       (REPORTS:['R'] required for this endpoint)
requestValidationMiddleware           (AJV: { docInstanceUuid: string })
DownloadReportController.downloadReport
```

Service:
```
DownloadReportService.run({ docInstanceUuid })
  1. const scope = resolveOwnerScope(user)
       'corporate' → { column: 'hospital_id', value: user.hospitalId }
       'doctor'    → { column: 'doctor_id',   value: user.doctorId   }
       'patient'   → { column: 'patient_id',  value: user.patientId  }
     if !scope || scope.value == null → addError('AccountNotLinkedErrorType')

  2. ONE query — ownership baked into WHERE; no separate fetch+check:
       SELECT di.id, di.status, di.pdf_file_path
       FROM doc_instances di
       JOIN test_results tr ON tr.id = di.test_result_id
       WHERE di.uuid     = :docInstanceUuid
         AND di.status   = 'RELEASED'
         AND tr.<scope.column> = :scope.value
       LIMIT 1;

       Implementation: DocInstanceRepository.findReleasedByUuidScoped(
         docInstanceUuid,
         { ownerColumn, ownerValue },
         { attributes: ['id','status','pdfFilePath'] }
       )

  3. If no row → addError('DocInstanceNotFoundErrorType')
       Same error for all of:
         (a) UUID doesn't exist
         (b) UUID exists but status != RELEASED
         (c) UUID exists, released, but caller isn't an owner
       Prevents enumeration via differential errors.

  4. If !pdfFilePath → addError('PdfNotGeneratedErrorType')

  5. filePath = path.join(process.cwd(), pdfFilePath)
     fs.access(filePath); realpath; allowedDir = realpath('./downloads')
     if !realPath.startsWith(allowedDir) → addError('DocInstanceNotFoundErrorType')

  6. Return { filePath: realPath, fileName: basename(realPath) }
```

Controller streams the file via `res.download(filePath, fileName)`.

**Payment role behavior:** a payment-role user (account_type='corporate', role_type='PAYMENT') automatically gets download access via the `REPORTS` permission module — no special branch in code. Their `/corporate/patients` access is denied at the middleware level because they don't have `CORPORATE` in their permission shape. Ownership scope still uses `hospital_id` (since they're a corporate-account user).

### Read APIs

All read APIs use the same middleware chain as download (context → auth → checkPermission → validation → controller → response validation).

#### `GET /corporate/patients` and `GET /doctor/patients`

Same controller method + same service (`getMyPatients.service.js`). Filter source switches on `accountType` from JWT.

```sql
SELECT DISTINCT p.uuid, p.first_name, p.last_name, p.date_of_birth, p.email, u.phone
FROM patients p
JOIN test_results tr ON tr.patient_id = p.id
LEFT JOIN users u ON u.patient_id = p.id
WHERE tr.<scope.column> = :scope.value
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?;
```

Presenter:
```json
[{
  "patientId": "<patient.uuid>",
  "name": "<firstName> <lastName>",
  "dob": "<dateOfBirth>",
  "mobile": "<user.phone>",
  "email": "<email>"
}]
```

Response wrapper: `{ data: [...], count: <int>, errors: [] }`.

#### `GET /corporate/patient-report?patientUuid=<uuid>` and `GET /doctor/patient-report?patientUuid=<uuid>`

Single service (`getPatientReport.service.js`). Single SQL query — patient lookup, ownership filter, and status filters all in one WHERE.

```sql
SELECT tr.uuid, tr.created_at,
       p.first_name, p.last_name, p.uuid AS patient_uuid,
       tc.test_name, tc.methodology,
       di.uuid AS doc_uuid, di.released_date
FROM test_results tr
JOIN patients         p  ON p.id  = tr.patient_id
JOIN test_categories  tc ON tc.id = tr.test_category_id
JOIN doc_instances    di ON di.test_result_id = tr.id
WHERE p.uuid = :patientUuid
  AND tr.<scope.column> = :scope.value
  AND tr.status     = 'completed'
  AND tr.lab_status = 'RECORD_MANAGEMENT'
  AND di.status     = 'RELEASED'
ORDER BY di.released_date DESC
LIMIT ? OFFSET ?;
```

A request for a patient outside the caller's scope returns `data: []` (not a 404). Enumeration-resistant.

Presenter:
```json
[{
  "patientId": "<patient.uuid>",
  "patientName": "<firstName> <lastName>",
  "createdAt": "<test.createdAt>",
  "testDone": "<testCategory.testName>-<methodology>",
  "reportDate": "<docInstance.releasedDate>",
  "docInstanceUuid": "<docInstance.uuid>"
}]
```

#### `GET /corporate/test-catalog` and `GET /doctor/test-catalog`

Single service (`getTestCatalog.service.js`). Same data for both roles — no scoping.

```sql
SELECT test_name, test_code, tat
FROM test_categories
ORDER BY test_name ASC
LIMIT ? OFFSET ?;
```

Presenter:
```json
[{ "testName": "...", "testCode": "...", "turnAroundTime": "..." }]
```

#### `GET /patient/report-status`

`getMyReportStatus.service.js`. Patient sees the status of every test for them, regardless of `docInstance.status` (i.e., not gated on RELEASED — they see in-progress journeys too).

```sql
SELECT tr.uuid, tr.created_at, tr.status, tr.turn_around_time,
       tc.test_name, tc.methodology,
       di.uuid AS doc_uuid
FROM test_results tr
LEFT JOIN test_categories tc ON tc.id = tr.test_category_id
LEFT JOIN doc_instances    di ON di.test_result_id = tr.id
WHERE tr.patient_id = :userPatientId
ORDER BY tr.created_at DESC
LIMIT ? OFFSET ?;
```

Presenter:
```json
[{
  "testName": "<testCategory.testName>-<methodology>",
  "receivedDate": "<test.createdAt>",
  "testStatus": "<test.status>",
  "turnAroundTime": "<test.turnAroundTime>",
  "docInstanceUuid": "<docInstance.uuid | null>"
}]
```

### `resolveOwnerScope` helper

```js
// src/libs/resolveOwnerScope.js
export const resolveOwnerScope = (user) => {
  switch (user?.accountType) {
    case 'corporate': return { column: 'hospital_id', value: user.hospitalId }
    case 'doctor':    return { column: 'doctor_id',   value: user.doctorId   }
    case 'patient':   return { column: 'patient_id',  value: user.patientId  }
    default:          return null
  }
}
```

Pure function. Imported by `DownloadReportService`, `GetMyPatientsService`, `GetPatientReportService`, and `ValidateUserAccountLinkService`.

### `ValidateUserAccountLinkService`

Called once from `LoginService` after credentials check. Confirms the FK on the user row resolves to a real entity row; not called on every request.

```js
// src/services/user/validateUserAccountLink.service.js
import ServiceBase from '../../libs/serviceBase'
import HospitalRepository from '../../infrastructure/repositories/hospitalRepository'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import ajv from '../../libs/ajv'
import { resolveOwnerScope } from '../../libs/resolveOwnerScope'

const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        accountType: { type: 'string', enum: ['corporate', 'patient', 'doctor'] },
        hospitalId:  { type: ['number', 'null'] },
        doctorId:    { type: ['number', 'null'] },
        patientId:   { type: ['number', 'null'] }
      },
      required: ['accountType']
    }
  },
  required: ['user']
}
const constraints = ajv.compile(schema)

export default class ValidateUserAccountLinkService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { user } = this.args
    const scope = resolveOwnerScope(user)

    if (!scope || scope.value == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const repoByType = {
      corporate: HospitalRepository,
      doctor:    DoctorRepository,
      patient:   PatientRepository
    }

    const entity = await repoByType[user.accountType].findById(scope.value, {
      attributes: ['id']
    })

    if (!entity) {
      return this.addError('AccountLinkBrokenErrorType')
    }

    return { column: scope.column, id: scope.value }
  }
}
```

### Error handling

New / changed error types in `src/libs/errorTypes.js`:

| Error type | HTTP | Used in |
|---|---|---|
| `UserNotExistsErrorType` (existing) | 404 | login |
| `InvalidCredentialsErrorType` (existing) | 401 | login |
| `PasswordExpiredErrorType` (existing) | 401 | login |
| `AccountNotLinkedErrorType` (new) | 422 | login (FK null) + scoped services (defensive) |
| `AccountLinkBrokenErrorType` (new) | 422 | login (FK doesn't resolve) |
| `DocInstanceNotFoundErrorType` (new or aligned) | 404 | download (covers: missing, not released, not yours, traversal fail) |
| `PdfNotGeneratedErrorType` (new) | 404 | download (row exists, pdfFilePath null) |
| `PermissionDeniedErrorType` (existing) | 403 | `checkPermission` middleware |

Removed (no longer emitted):
- `PhoneNotVerifiedErrorType` (OTP gate dropped from login).
- `PatientNotFoundErrorType`, `DocInstanceNotReleasedErrorType`, `UnauthorizedDocAccessErrorType` — folded into `DocInstanceNotFoundErrorType` for enumeration-resistance.

Single error code for download "not found" cases is deliberate. Distinct codes for "exists but not yours," "exists but not released," and "doesn't exist" let an attacker enumerate UUIDs. One opaque 404 keeps the attack surface minimal. Internal admin tools have separate visibility into these distinctions when needed.

### Logging

Per `claude.md` logging pattern (single-line, JSON-stringified context). Each service logs:
- entry (with sanitized args — never `password`, `encryptedPassword`, raw JWT, PDF bytes)
- repository result (id only or count)
- success / error with full context

`UserRepository.findByUserNameOrPhoneWithRoleIn` logs the lookup result (id only).

`DocInstanceRepository.findReleasedByUuidScoped` logs the scoped query parameters and the row count returned.

---

## Files Modified

### Internal (`fsg_internal_backend`)

| File | Change |
|---|---|
| `src/db/migrations/<existing form_requests migration>` | `doctor_id` → `allowNull: false` |
| `src/db/migrations/<existing test_results migration>` | `hospital_id`, `doctor_id` → `allowNull: false` |
| `src/db/migrations/<existing test_categories migration>` | Add 5 columns: `test_sub_category`, `finance_department`, `outsource_lab_test_code`, `storage_stability`, `client_tat` |
| `src/db/migrations/<existing users migration>` | Rename column `user_type` → `account_type` |
| `src/db/models/formRequest.model.js` | `doctorId` allowNull false |
| `src/db/models/testResult.model.js` | `hospitalId`, `doctorId` allowNull false |
| `src/db/models/testCategory.model.js` | New attributes |
| `src/db/models/user.model.js` | `userType` → `accountType` |
| `src/db/seeders/20251006185710-add-roles-to-user-role.js` | Rename roles to external vocab; add `REPORTS:['R']` to PATIENT |
| `src/db/seeders/20251010100001-adding-users.js` | `user_type` → `account_type` field name; values aligned (`hospital`→`corporate` if any) |

Provide manual `ALTER TABLE` SQLs (with backfill `UPDATE`s where needed) for local DB sync per `claude.md`.

### External (`fsg_client_backend`)

#### Models — drop
- `src/db/models/corporate.model.js`
- `src/db/models/individual.model.js`
- `src/db/models/clinic.model.js`
- `src/db/models/category.model.js`

#### Models — add (mirror internal subset)
- `src/db/models/hospital.model.js`
- `src/db/models/patient.model.js`
- `src/db/models/formRequest.model.js`
- `src/db/models/docInstance.model.js`

#### Models — align
- `src/db/models/doctor.model.js`
- `src/db/models/testCategory.model.js` (with 5 new attributes)
- `src/db/models/testResult.model.js` (FKs renamed; `hospitalId`/`doctorId` NOT NULL)
- `src/db/models/user.model.js` (`userType` → `accountType`; FKs to patient/hospital/doctor)
- `src/db/models/userRole.model.js` (align with internal)
- `src/db/models/userToken.model.js`, `contactRequests.model.js`, `paymentTransaction.model.js` — left alone unless they import a dropped model

#### Repositories — drop
- `src/infrastructure/repositories/corporateRepository.js`

#### Repositories — add
- `src/infrastructure/repositories/hospitalRepository.js` — `findById`
- `src/infrastructure/repositories/patientRepository.js` — `findById`, `findByUuid`, list methods for `getMyPatients`
- `src/infrastructure/repositories/docInstanceRepository.js` — `findByUuid`, `findReleasedByUuidScoped`

#### Repositories — refactor
- `src/infrastructure/repositories/userRepository.js`
  - `findByUserNameOrPhoneWithRoleIn(userNameOrPhone, roleTypes, options)` — replaces `findByUserNameOrPhoneAndTypeWithUserRole`; filters on `UserRole.roleType IN (...)`.
  - Rename `corporateId` → `hospitalId` everywhere.
- `src/infrastructure/repositories/testResultRepository.js`
  - Rewrite WHERE clause to use new FK names (`patientId`, `hospitalId`, `doctorId`, `formRequestId`, `testCategoryId`).
  - Add list methods used by `getMyPatients`, `getPatientReport`, `getMyReportStatus`.
- `src/infrastructure/repositories/testCategoryRepository.js` — `findAll` for `getTestCatalog`.
- `src/domain/repositories/IPaymentTransactionRepository.js` — fix references to dropped FK names (defer if interface is unused).

#### Domain interfaces
- `src/domain/repositories/IUserRepository.js`, `ITestResultRepository.js`, etc. — update method signatures to match repos.

#### Libraries
- `src/libs/permissions.js` — replaced (see §Permission middleware).
- `src/libs/resolveOwnerScope.js` — **new**, pure function.
- `src/libs/errorTypes.js` — add `AccountNotLinkedErrorType`, `AccountLinkBrokenErrorType`, `DocInstanceNotFoundErrorType`, `PdfNotGeneratedErrorType`. Remove `PhoneNotVerifiedErrorType` (or keep but stop emitting from login).

#### Services — drop
- `src/services/corporate/getCorporatePatients.service.js`
- `src/services/corporate/getCorporateTestResults.service.js`
- `src/services/dashboard/getAllTestResult.service.js` (only if it imports dropped models — defer otherwise)

#### Services — add
- `src/services/recordManagement/getMyPatients.service.js`
- `src/services/recordManagement/getPatientReport.service.js`
- `src/services/recordManagement/downloadReport.service.js`
- `src/services/testCategory/getTestCatalog.service.js`
- `src/services/patient/getMyReportStatus.service.js`
- `src/services/user/validateUserAccountLink.service.js`

#### Services — refactor
- `src/services/user/login.service.js`
  - DTO: 3-value `accountType`.
  - Maps `accountType` → roleTypes; calls `findByUserNameOrPhoneWithRoleIn`.
  - Drops OTP gate (no `phoneVerified` short-circuit).
  - Calls `ValidateUserAccountLinkService.run({ user })` after credentials check.

#### Services — leave (per "for now let it be as it is" guidance)
- `src/services/user/{signup,changePassword*,forgotPassword,verify*,update*,uploadProfilePhoto,sendVerifyEmail,getUserDetail,createContactRequest,logout,getUserDeposit/WithdrawTransaction,transactionList}` — unchanged unless they import a dropped model.
- `src/services/email/`, `src/services/file/` (non-download utility), `src/services/generateCode/`, `src/services/phone/`, `src/services/demo/`, `src/services/payment/`, `src/services/transactions/` — unchanged unless they import dropped models.

#### Controllers — add
- `src/rest-resources/controllers/recordManagement.controller.js` — methods: `getMyPatients`, `getPatientReport`, `downloadReport`.
- `src/rest-resources/controllers/patient.controller.js` — `getMyReportStatus`.

#### Controllers — refactor
- `src/rest-resources/controllers/user.controller.js` — `login` updated to new service signature; rest unchanged.
- `src/rest-resources/controllers/testCategory.controller.js` — `getTestCatalog` (replaces or supplements existing).

#### Controllers — drop
- Existing `corporate.controller.js`, `doctor.controller.js`, `payment.controller.js` methods that consumed dropped services. Trim or delete file as appropriate.

#### Middleware
- **Drop:** `src/rest-resources/middlewares/fileAuthorization.middleware.js`.
- **Keep + reuse:** `src/rest-resources/middlewares/checkPermission.middleware.js` (unchanged).
- **No new middleware** — `requireAccountType` was rejected in favor of `checkPermission` permission-based gating.

#### Routes
- `src/rest-resources/routes/api/v1/user.routes.js` — `POST /user/login` updated.
- `src/rest-resources/routes/api/v1/corporate.routes.js` — replace contents with three new routes:
  - `GET /corporate/patients`
  - `GET /corporate/patient-report`
  - `GET /corporate/test-catalog`
- `src/rest-resources/routes/api/v1/doctor.routes.js` — replace with:
  - `GET /doctor/patients`
  - `GET /doctor/patient-report`
  - `GET /doctor/test-catalog`
- `src/rest-resources/routes/api/v1/patient.routes.js` — **new file**, `GET /patient/report-status`.
- `src/rest-resources/routes/api/v1/reports.routes.js` — **new file**, `GET /reports/download`.
- `src/rest-resources/routes/api/v1/payment.routes.js`, `transactions.routes.js`, `dashboard.routes.js` — leave unless they reference dropped services; trim/delete as needed.
- `src/rest-resources/routes/api/v1/index.js` — register new patient + reports route files; remove dead route imports.

Each authenticated route's middleware chain:
```js
contextMiddleware,
authenticationMiddleware,
checkPermission,
requestValidationMiddleware(<schema>),
<Controller>.<method>,
responseValidationMiddleware(<schema>)
```

---

## Files NOT modified (intentional)

- Internal services that aren't on the auth/download path (form submission, batches, samples, doc generation, record management write paths) — schema flips don't require service changes beyond what already populates the fields correctly.
- External: signup, password recovery, email/phone verification flows — kept as-is per "for now let it be as it is."
- Internal `submitFormRequest` — does NOT change here. The M2M backfill of `patient_doctors` / `patient_hospitals` is sub-project 2.
- TestCategory data load from JSON — schema additions only; data load is sub-project 4.

---

## Testing

Codebase has no integration-test harness; manual curl + log inspection per existing pattern. Test framework setup is acknowledged as future work, not in this spec.

### DB-layer verification (after step 1)

```
psql > \d test_results          # hospital_id NOT NULL, doctor_id NOT NULL
psql > \d form_requests         # doctor_id NOT NULL
psql > \d users                 # column is account_type (not user_type)
psql > \d test_categories       # 5 new columns present

psql > SELECT name, role_type FROM user_roles ORDER BY id;
       expect: FSG:PATIENT/PATIENT, FSG:CORPORATE/CORPORATE,
               FSG:DOCTOR/DOCTOR, FSG:PAYMENT/PAYMENT

psql > SELECT permission FROM user_roles WHERE role_type='PATIENT';
       expect: { "PATIENT":["R"], "REPORTS":["R"] }

psql > SELECT count(*) FROM test_results WHERE hospital_id IS NULL;   -- expect 0
psql > SELECT count(*) FROM test_results WHERE doctor_id   IS NULL;   -- expect 0
psql > SELECT count(*) FROM form_requests WHERE doctor_id  IS NULL;   -- expect 0

psql > SELECT DISTINCT account_type FROM users;
       expect: corporate | patient | doctor   (no 'hospital' or 'individual')
```

### Boot smoke

```
$ cd fsg_internal_backend && npm start            # internal still boots
$ cd fsg_client_backend  && npm start             # external boots, no MODULE_NOT_FOUND
$ curl -i $EXT/admin/api/v1/health                # 200 (or whatever the existing health endpoint is)
```

### Login (POST /user/login)

| # | Scenario | Expected |
|---|---|---|
| L1 | corporate role hospital user, valid creds, accountType:'corporate' | 200 + accessToken |
| L2 | corporate role payment user, valid creds, accountType:'corporate' | 200 (mapping `corporate→[CORPORATE,PAYMENT]` works) |
| L3 | patient, valid creds, accountType:'patient' | 200 |
| L4 | doctor, valid creds, accountType:'doctor' | 200 |
| L5 | wrong password | 401 InvalidCredentialsErrorType |
| L6 | unknown user | 404 UserNotExistsErrorType |
| L7 | corporate user whose `hospital_id` row was deleted | 422 AccountLinkBrokenErrorType |
| L8 | corporate user with `hospital_id IS NULL` | 422 AccountNotLinkedErrorType |
| L9 | invalid accountType (e.g., 'admin') | 400 from AJV |
| L10 | unverified phone, valid creds | 200 (OTP gate removed; verify gate is gone) |

### Permission gating

| # | Scenario | Caller's role | Expected |
|---|---|---|---|
| P1 | patient hits /corporate/patients | PATIENT | 403 PermissionDeniedErrorType |
| P2 | doctor hits /patient/report-status | DOCTOR | 403 |
| P3 | payment-role user hits /reports/download | PAYMENT | 200 (has REPORTS) |
| P4 | payment-role user hits /corporate/patients | PAYMENT | 403 (no CORPORATE) |
| P5 | corporate-role user hits /reports/download | CORPORATE | 200 |

### Download (GET /reports/download)

| # | Scenario | Expected |
|---|---|---|
| D1 | corporate user (H1) downloads released doc owned by H1 | 200, file streams |
| D2 | doctor (D1) downloads released doc owned by D1 | 200 |
| D3 | patient (P1) downloads released doc owned by P1 | 200 |
| D4 | corporate user (H1) tries to download doc owned by H2 | 404 DocInstanceNotFoundErrorType |
| D5 | doc not yet RELEASED | 404 (same error as D4) |
| D6 | non-existent uuid | 404 (same) |
| D7 | uuid valid, pdf_file_path null | 404 PdfNotGeneratedErrorType |
| D8 | path-traversal attempt (pdfFilePath = `../../etc/passwd`) | 404 DocInstanceNotFoundErrorType |
| D9 | downloads/ volume not mounted | 404 DocInstanceNotFoundErrorType |

D4–D6 and D8–D9 must return identical response bodies (no enumeration via differential errors).

### Read APIs

#### `/corporate/patients` (and `/doctor/patients`)
- M1: corporate user H1 → returns only patients linked through `test_results.hospital_id=H1`
- M2: corporate user H2 with no linked patients → empty array
- M3: pagination with `?limit=2&offset=0` (DTO accepts `limit`, `offset`)
- M4: search by patient name with `?search=` (DTO accepts an optional `search` string)

#### `/corporate/patient-report?patientUuid=` (and `/doctor/...`)
- R1: corporate user H1, patient owned by H1, has completed/released tests → list returned
- R2: corporate user H1, patient owned by H2 → empty array (per the in-SQL filter)
- R3: completed but not released → not returned
- R4: released but `lab_status != RECORD_MANAGEMENT` → not returned

#### `/corporate/test-catalog` (and `/doctor/...`)
- C1: returns all `test_categories` rows with `{testName, testCode, turnAroundTime}` shape
- C2: pagination + search

#### `/patient/report-status`
- S1: patient with multiple tests in mixed statuses → all returned (no `docInstance.status` filter)
- S2: patient with no tests → empty array
- S3: doc_instance row missing for some tests → `docInstanceUuid: null`

### End-to-end smoke (post-deploy)

1. Log in as corporate user via external. Receive token.
2. `GET /corporate/patients` → see expected list.
3. Pick a patientUuid; `GET /corporate/patient-report?patientUuid=X` → see released tests.
4. Pick a docInstanceUuid; `GET /reports/download?docInstanceUuid=Y` → file downloads.
5. Log out, log in as patient. `GET /patient/report-status` → see all tests.
6. As patient, `GET /reports/download` for a RELEASED docInstance owned by them → file downloads.
7. As patient, attempt `GET /reports/download` on a docInstance not owned by them → 404.

### Future test work (out of scope)

- Jest + Supertest integration tests against a test DB.
- Load/perf testing for the download endpoint.

---

## Open questions

None blocking. Two callouts for product/ops:

1. **Payment role download access** — currently inherits the `corporate` ownership scope (sees same hospital's reports). If product wants payment role restricted to invoice-only downloads, that's a follow-up — would require a separate endpoint or a per-role check inside `DownloadReportService`.
2. **Internal admin role naming** — this spec touches `user_roles` exclusively for external account types. Internal will later introduce its own admin role naming on `admins` / `admin_roles` tables; that work is separate.
