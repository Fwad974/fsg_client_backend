# External Backend Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user has explicitly opted out of subagents — execute inline, pause for approval at each task boundary.

**Goal:** Rebuild `fsg_client_backend` (external) so it consumes the shared internal Postgres database, replacing legacy `Corporate/Individual/Clinic/Category` abstractions with internal-aligned `Hospital/Patient/Doctor/TestResult/FormRequest/DocInstance/TestCategory` models, refactored auth, a UUID-based PDF download, and new role-scoped read APIs.

**Architecture:** Single shared DB (internal owns migrations + seeds). External re-declares model files for the subset of tables it queries. Bottom-up layered execution: DB → AJV/libs → services → controllers → routes. Each layer touched once. Defense-in-depth: `checkPermission` middleware (per-module) plus in-SQL ownership filters (per-row) for scoped data.

**Tech Stack:** Node.js, Express, Sequelize (Postgres), AJV, Bull/Redis, JWT, bcrypt.

**Reference spec:** `docs/superpowers/specs/2026-04-27-external-realignment-design.md`

---

## File Structure

This plan changes ~45 files across two repos. Touched files grouped by layer:

### Internal (`fsg_internal_backend`)
| File | Change |
|---|---|
| `src/db/migrations/20251208000001-create-table-form-requests.js` | `doctor_id` → NOT NULL |
| `src/db/migrations/20251010100005-create-table-test_result.js` | `hospital_id`, `doctor_id` → NOT NULL |
| `src/db/migrations/20251026000001-create-table-test-categories.js` | Add 5 columns |
| `src/db/migrations/20251003113515-create-table-user.js` | Column rename `user_type` → `account_type` |
| `src/db/models/formRequest.model.js` | match migration |
| `src/db/models/testResult.model.js` | match migration |
| `src/db/models/testCategory.model.js` | new attributes |
| `src/db/models/user.model.js` | `userType` → `accountType` |
| `src/db/seeders/20251006185710-add-roles-to-user-role.js` | Vocab rename + REPORTS to PATIENT |
| `src/db/seeders/20251010100001-adding-users.js` | Field name + value rename |

### External (`fsg_client_backend`)
| File | Change |
|---|---|
| `src/db/models/corporate.model.js` | DELETE |
| `src/db/models/individual.model.js` | DELETE |
| `src/db/models/clinic.model.js` | DELETE |
| `src/db/models/category.model.js` | DELETE |
| `src/db/models/hospital.model.js` | NEW |
| `src/db/models/patient.model.js` | NEW |
| `src/db/models/formRequest.model.js` | NEW |
| `src/db/models/docInstance.model.js` | NEW |
| `src/db/models/doctor.model.js` | ALIGN |
| `src/db/models/testCategory.model.js` | ALIGN |
| `src/db/models/testResult.model.js` | ALIGN |
| `src/db/models/user.model.js` | ALIGN |
| `src/db/models/userRole.model.js` | ALIGN |
| `src/domain/repositories/ICorporateRepository.js` | DELETE |
| `src/domain/repositories/IIndividualRepository.js` | DELETE |
| `src/domain/repositories/IHospitalRepository.js` | NEW |
| `src/domain/repositories/IPatientRepository.js` | NEW |
| `src/domain/repositories/IDocInstanceRepository.js` | NEW |
| `src/domain/repositories/IUserRepository.js` | ALIGN |
| `src/domain/repositories/ITestResultRepository.js` | ALIGN |
| `src/domain/repositories/ITestCategoryRepository.js` | ALIGN |
| `src/infrastructure/repositories/corporateRepository.js` | DELETE |
| `src/infrastructure/repositories/individualRepository.js` | DELETE |
| `src/infrastructure/repositories/userRepository.js` | REFACTOR |
| `src/infrastructure/repositories/testResultRepository.js` | REFACTOR |
| `src/infrastructure/repositories/testCategoryRepository.js` | REFACTOR |
| `src/infrastructure/repositories/hospitalRepository.js` | NEW |
| `src/infrastructure/repositories/patientRepository.js` | NEW |
| `src/infrastructure/repositories/docInstanceRepository.js` | NEW |
| `src/libs/permissions.js` | REPLACE |
| `src/libs/resolveOwnerScope.js` | NEW |
| `src/libs/errorTypes.js` | ADD entries |
| `src/services/user/login.service.js` | REFACTOR |
| `src/services/user/validateUserAccountLink.service.js` | NEW |
| `src/services/recordManagement/getMyPatients.service.js` | NEW |
| `src/services/recordManagement/getPatientReport.service.js` | NEW |
| `src/services/recordManagement/downloadReport.service.js` | NEW |
| `src/services/testCategory/getTestCatalog.service.js` | NEW |
| `src/services/patient/getMyReportStatus.service.js` | NEW |
| `src/services/corporate/getCorporatePatients.service.js` | DELETE |
| `src/services/corporate/getCorporateTestResults.service.js` | DELETE |
| `src/services/dashboard/getAllTestResult.service.js` | DELETE if it imports dropped |
| `src/rest-resources/controllers/user.controller.js` | REFACTOR `login` |
| `src/rest-resources/controllers/recordManagement.controller.js` | NEW |
| `src/rest-resources/controllers/patient.controller.js` | NEW |
| `src/rest-resources/controllers/testCategory.controller.js` | REFACTOR |
| `src/rest-resources/controllers/{corporate,doctor,dashboard,fileDownload,payment}.controller.js` | TRIM dead methods |
| `src/rest-resources/middlewares/fileAuthorization.middleware.js` | DELETE |
| `src/rest-resources/routes/api/v1/user.routes.js` | REFACTOR login route |
| `src/rest-resources/routes/api/v1/corporate.routes.js` | REPLACE |
| `src/rest-resources/routes/api/v1/doctor.routes.js` | REPLACE |
| `src/rest-resources/routes/api/v1/patient.routes.js` | NEW |
| `src/rest-resources/routes/api/v1/reports.routes.js` | NEW |
| `src/rest-resources/routes/api/v1/index.js` | Register new + remove dead |
| `src/rest-resources/routes/api/v1/{dashboard,payment,transactions}.routes.js` | TRIM dead handlers |

---

## Conventions for every task

- **Pause for approval after each task's commit step.** Do not chain tasks.
- **Verify each JS edit:** `node --check <file>` returns no output on success.
- **Internal schema changes** require both migration edit AND a manual `ALTER TABLE`/`UPDATE` SQL block (per `claude.md` rule for existing tables). The plan shows both.
- **No tests run** — codebase has no integration test harness. Verifications are: parse-check, boot smoke, and the final curl-driven smoke checklist.
- **Working dirs** in commits:
  - Internal: `cd /home/kia/Desktop/work/fsg/fsg_internal_backend`
  - External: `cd /home/kia/Desktop/work/fsg/fsg_client_backend`

---

# Layer 1A — Internal schema flips

## Task 1: Flip `form_requests.doctor_id` to NOT NULL

**Files:**
- Modify: `fsg_internal_backend/src/db/migrations/20251208000001-create-table-form-requests.js`
- Modify: `fsg_internal_backend/src/db/models/formRequest.model.js`

- [ ] **Step 1: Open the migration and find the `doctor_id` column block**

Run: `grep -n "doctor_id" /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251208000001-create-table-form-requests.js`

Expect: a line referencing `doctor_id` with `allowNull: true`.

- [ ] **Step 2: Flip `allowNull` to `false` in the migration**

In the `doctor_id` column definition, change `allowNull: true` to `allowNull: false`.

- [ ] **Step 3: Mirror in the model**

In `fsg_internal_backend/src/db/models/formRequest.model.js`, line 35-39 currently:

```js
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'doctor_id'
    },
```

Change to:

```js
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'doctor_id'
    },
```

- [ ] **Step 4: Verify both files parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251208000001-create-table-form-requests.js
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/models/formRequest.model.js
```

Expected: no output (success).

- [ ] **Step 5: Provide manual ALTER for local DB sync**

Tell the user to run, in their DB:

```sql
-- Backfill any existing NULL doctor_id rows by copying from… nothing usable — flag and abort if any exist.
SELECT count(*) FROM form_requests WHERE doctor_id IS NULL;
-- Expected: 0. If non-zero, STOP and decide: delete those rows, or assign a placeholder doctor_id.
ALTER TABLE form_requests ALTER COLUMN doctor_id SET NOT NULL;
```

- [ ] **Step 6: Commit (internal repo)**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/migrations/20251208000001-create-table-form-requests.js src/db/models/formRequest.model.js
git commit -m "refactor(form-requests): doctor_id NOT NULL

Every form must have a doctor. Aligns with new external download
authz path that uses test_results denormalized FKs (which inherit
this invariant)."
```

**PAUSE for approval.**

---

## Task 2: Flip `test_results.hospital_id` and `doctor_id` to NOT NULL

**Files:**
- Modify: `fsg_internal_backend/src/db/migrations/20251010100005-create-table-test_result.js`
- Modify: `fsg_internal_backend/src/db/models/testResult.model.js`

- [ ] **Step 1: Open the migration; find the two columns**

Run: `grep -nE "hospital_id|doctor_id" /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251010100005-create-table-test_result.js`

Expect: two `allowNull: true` lines (one per column).

- [ ] **Step 2: Flip both to `allowNull: false` in the migration**

Edit the migration so both `hospital_id` and `doctor_id` column definitions have `allowNull: false`.

- [ ] **Step 3: Mirror in the model**

In `fsg_internal_backend/src/db/models/testResult.model.js`, lines 17-26 currently:

```js
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'hospital_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'doctor_id'
    },
```

Change both `allowNull: true` to `allowNull: false`.

- [ ] **Step 4: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251010100005-create-table-test_result.js
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/models/testResult.model.js
```

- [ ] **Step 5: Manual ALTER + backfill SQL**

```sql
-- Pre-flight: count NULLs.
SELECT count(*) AS null_hospitals FROM test_results WHERE hospital_id IS NULL;
SELECT count(*) AS null_doctors   FROM test_results WHERE doctor_id   IS NULL;

-- Backfill from FormRequest (canonical source) for any test_result with NULL FKs.
UPDATE test_results tr
   SET hospital_id = fr.hospital_id
  FROM form_requests fr
 WHERE tr.form_request_id = fr.id
   AND tr.hospital_id IS NULL;

UPDATE test_results tr
   SET doctor_id = fr.doctor_id
  FROM form_requests fr
 WHERE tr.form_request_id = fr.id
   AND tr.doctor_id IS NULL;

-- Verify zeros now.
SELECT count(*) FROM test_results WHERE hospital_id IS NULL;  -- expect 0
SELECT count(*) FROM test_results WHERE doctor_id   IS NULL;  -- expect 0

ALTER TABLE test_results ALTER COLUMN hospital_id SET NOT NULL;
ALTER TABLE test_results ALTER COLUMN doctor_id   SET NOT NULL;
```

- [ ] **Step 6: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/migrations/20251010100005-create-table-test_result.js src/db/models/testResult.model.js
git commit -m "refactor(test-results): hospital_id and doctor_id NOT NULL

Denormalized FKs from form_requests are now mandatory on every test
result. External download authz reads these columns directly to
avoid joining form_requests on every request."
```

**PAUSE for approval.**

---

## Task 3: Add 5 new columns to `test_categories`

**Files:**
- Modify: `fsg_internal_backend/src/db/migrations/20251026000001-create-table-test-categories.js`
- Modify: `fsg_internal_backend/src/db/models/testCategory.model.js`

- [ ] **Step 1: Add the 5 columns to the migration**

In the migration's `createTable` block, append these column definitions before `created_at`:

```js
    test_sub_category: {
      type: Sequelize.STRING,
      allowNull: true
    },
    finance_department: {
      type: Sequelize.STRING,
      allowNull: true
    },
    outsource_lab_test_code: {
      type: Sequelize.STRING,
      allowNull: true
    },
    storage_stability: {
      type: Sequelize.STRING,
      allowNull: true
    },
    client_tat: {
      type: Sequelize.STRING,
      allowNull: true
    },
```

- [ ] **Step 2: Add matching attributes to the model**

In `fsg_internal_backend/src/db/models/testCategory.model.js`, after the existing `proposedInternalTat` block (around line 112) and before `isReferral`, add:

```js
    testSubCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'test_sub_category'
    },
    financeDepartment: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'finance_department'
    },
    outsourceLabTestCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'outsource_lab_test_code'
    },
    storageStability: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'storage_stability'
    },
    clientTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'client_tat'
    },
```

- [ ] **Step 3: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251026000001-create-table-test-categories.js
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/models/testCategory.model.js
```

- [ ] **Step 4: Manual ALTER for local DB**

```sql
ALTER TABLE test_categories ADD COLUMN test_sub_category       VARCHAR(255) NULL;
ALTER TABLE test_categories ADD COLUMN finance_department      VARCHAR(255) NULL;
ALTER TABLE test_categories ADD COLUMN outsource_lab_test_code VARCHAR(255) NULL;
ALTER TABLE test_categories ADD COLUMN storage_stability       VARCHAR(255) NULL;
ALTER TABLE test_categories ADD COLUMN client_tat              VARCHAR(255) NULL;
```

- [ ] **Step 5: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/migrations/20251026000001-create-table-test-categories.js src/db/models/testCategory.model.js
git commit -m "feat(test-categories): add 5 columns from incoming JSON catalog

Adds testSubCategory, financeDepartment, outsourceLabTestCode,
storageStability, clientTat. All nullable; data load is sub-project 4."
```

**PAUSE for approval.**

---

## Task 4: Rename `users.user_type` to `users.account_type`

**Files:**
- Modify: `fsg_internal_backend/src/db/migrations/20251003113515-create-table-user.js`
- Modify: `fsg_internal_backend/src/db/models/user.model.js`

- [ ] **Step 1: Rename column in migration**

Find the `user_type` line in the migration and rename it to `account_type`. Keep `STRING`/nullable shape unchanged.

- [ ] **Step 2: Rename attribute in model**

In `fsg_internal_backend/src/db/models/user.model.js`, line 91-94:

```js
    userType: {
      type: DataTypes.STRING,
      allowNull: true
    },
```

Replace with:

```js
    accountType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_type'
    },
```

- [ ] **Step 3: Grep internal for any service-layer reference to `userType`**

```bash
grep -rn "userType\b\|user_type\b" /home/kia/Desktop/work/fsg/fsg_internal_backend/src --include="*.js" | grep -v node_modules
```

If any hits in `src/services/`, `src/infrastructure/`, or `src/rest-resources/` — rename to `accountType` / `account_type`. (Most likely zero hits since this column was added but not yet read by internal code; confirm.)

- [ ] **Step 4: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/migrations/20251003113515-create-table-user.js
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/models/user.model.js
```

- [ ] **Step 5: Manual ALTER for local DB**

```sql
ALTER TABLE users RENAME COLUMN user_type TO account_type;
```

- [ ] **Step 6: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/migrations/20251003113515-create-table-user.js src/db/models/user.model.js
git commit -m "refactor(users): rename user_type to account_type

Column now answers 'which entity owns this account'. Disambiguates
from user_roles.role_type which describes permissions, not ownership."
```

**PAUSE for approval.**

---

# Layer 1B — Internal seed updates

## Task 5: Update `user_roles` seeder to external vocabulary

**Files:**
- Modify: `fsg_internal_backend/src/db/seeders/20251006185710-add-roles-to-user-role.js`

- [ ] **Step 1: Replace the entire `bulkInsert` payload**

Current contents of `bulkInsert('user_roles', [...])` are 4 records with `role_type` `PATIENT|HOSPITAL|DOCTOR|PAYMENT`. Replace with:

```js
      await queryInterface.bulkInsert('user_roles', [
        {
          id: 1,
          name: 'FSG:PATIENT',
          role_type: 'PATIENT',
          permission: JSON.stringify({
            PATIENT: ['R'],
            REPORTS: ['R']
          }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'FSG:CORPORATE',
          role_type: 'CORPORATE',
          permission: JSON.stringify({
            CORPORATE: ['R'],
            REPORTS: ['R']
          }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'FSG:DOCTOR',
          role_type: 'DOCTOR',
          permission: JSON.stringify({
            DOCTOR: ['R'],
            REPORTS: ['R']
          }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'FSG:PAYMENT',
          role_type: 'PAYMENT',
          permission: JSON.stringify({
            PAYMENT: ['R'],
            REPORTS: ['R'],
            TRANSACTION: ['R']
          }),
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });
```

- [ ] **Step 2: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/seeders/20251006185710-add-roles-to-user-role.js
```

- [ ] **Step 3: Manual SQL for local DB**

```sql
UPDATE user_roles SET role_type = 'CORPORATE',
                       name      = 'FSG:CORPORATE',
                       permission = '{"CORPORATE":["R"],"REPORTS":["R"]}'::jsonb
 WHERE id = 2;

UPDATE user_roles SET permission = '{"PATIENT":["R"],"REPORTS":["R"]}'::jsonb
 WHERE id = 1;

UPDATE user_roles SET permission = '{"DOCTOR":["R"],"REPORTS":["R"]}'::jsonb
 WHERE id = 3;

UPDATE user_roles SET permission = '{"PAYMENT":["R"],"REPORTS":["R"],"TRANSACTION":["R"]}'::jsonb
 WHERE id = 4;

-- Verify
SELECT id, name, role_type, permission FROM user_roles ORDER BY id;
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/seeders/20251006185710-add-roles-to-user-role.js
git commit -m "refactor(seed): rename user_roles to external vocabulary

HOSPITAL becomes CORPORATE in role_type/name/permission to match
external public-facing vocab. PATIENT role gains REPORTS:['R'] so
patients can call /reports/download."
```

**PAUSE for approval.**

---

## Task 6: Update users seeder field name and values

**Files:**
- Modify: `fsg_internal_backend/src/db/seeders/20251010100001-adding-users.js`

- [ ] **Step 1: Find every `user_type` field**

```bash
grep -n "user_type" /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/seeders/20251010100001-adding-users.js
```

- [ ] **Step 2: Rename field name to `account_type` everywhere in this file**

Use editor find-replace: `user_type` → `account_type` (only inside this seeder).

- [ ] **Step 3: Rename any `'hospital'` value to `'corporate'`**

Find any seed row with `account_type: 'hospital'` (if any exists) and change to `account_type: 'corporate'`. Existing values `'patient'` and `'payment'` (for payment-role users on a hospital account) need attention:
- `account_type: 'patient'` stays as `'patient'`.
- `account_type: 'payment'` should become `account_type: 'corporate'` (because payment users are *corporate-account* with PAYMENT role).

- [ ] **Step 4: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_internal_backend/src/db/seeders/20251010100001-adding-users.js
```

- [ ] **Step 5: Manual SQL for any existing seeded data**

```sql
-- Field rename already applied in Task 4. Now align values.
UPDATE users SET account_type = 'corporate' WHERE account_type IN ('hospital', 'payment');
SELECT DISTINCT account_type FROM users;   -- expect: corporate | patient | doctor
```

- [ ] **Step 6: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend
git add src/db/seeders/20251010100001-adding-users.js
git commit -m "refactor(seed): align user account_type values

Field renamed (user_type → account_type) and values normalized:
hospital-account users (whether hospital-role or payment-role) all
seed with account_type='corporate'. The role tells you what kind
of corporate user."
```

**PAUSE for approval.**

---

# Layer 1C — External models

## Task 7: Drop external's legacy model files

**Files:**
- Delete: `fsg_client_backend/src/db/models/corporate.model.js`
- Delete: `fsg_client_backend/src/db/models/individual.model.js`
- Delete: `fsg_client_backend/src/db/models/clinic.model.js`
- Delete: `fsg_client_backend/src/db/models/category.model.js`

- [ ] **Step 1: Confirm what's about to break (record for next tasks)**

```bash
grep -RnE "models\.(Individual|Corporate|Category|Clinic)\b" /home/kia/Desktop/work/fsg/fsg_client_backend/src
grep -RnE "from .*\b(individual|corporate|category|clinic)\.model" /home/kia/Desktop/work/fsg/fsg_client_backend/src
```

Note the file list — these are the consumers we must update or delete in subsequent tasks. App will not boot until those are addressed.

- [ ] **Step 2: Delete the four files**

```bash
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/corporate.model.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/individual.model.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/clinic.model.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/category.model.js
```

- [ ] **Step 3: Stage deletions; do NOT commit yet — boot is broken until Task 18**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git rm src/db/models/corporate.model.js src/db/models/individual.model.js src/db/models/clinic.model.js src/db/models/category.model.js
git status   # should show 4 deletions staged
```

The commit lands as part of Task 18 once boot is restored.

**PAUSE for approval.**

---

## Task 8: Drop legacy domain interfaces

**Files:**
- Delete: `fsg_client_backend/src/domain/repositories/ICorporateRepository.js`
- Delete: `fsg_client_backend/src/domain/repositories/IIndividualRepository.js`

- [ ] **Step 1: Confirm no surviving consumers**

```bash
grep -RnE "ICorporateRepository|IIndividualRepository" /home/kia/Desktop/work/fsg/fsg_client_backend/src
```

If anything still references them, those will die in later tasks (the corporate/individual repositories themselves get deleted in Task 19).

- [ ] **Step 2: Delete**

```bash
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/domain/repositories/ICorporateRepository.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/domain/repositories/IIndividualRepository.js
```

- [ ] **Step 3: Stage**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git rm src/domain/repositories/ICorporateRepository.js src/domain/repositories/IIndividualRepository.js
```

Commit lands in Task 18 with the rest of the model layer.

**PAUSE for approval.**

---

## Task 9: Add `hospital.model.js` (external)

**Files:**
- Create: `fsg_client_backend/src/db/models/hospital.model.js`

- [ ] **Step 1: Write the file**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const Hospital = sequelize.define('Hospital', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    hospitalName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'hospital_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'hospitals',
    schema: 'public',
    timestamps: true
  })

  Hospital.associate = models => {
    Hospital.hasMany(models.User, {
      foreignKey: 'hospitalId',
      as: 'users'
    })
    Hospital.belongsToMany(models.Patient, {
      through: 'patient_hospitals',
      foreignKey: 'hospitalId',
      otherKey: 'patientId',
      as: 'patients'
    })
    Hospital.belongsToMany(models.Doctor, {
      through: 'hospital_doctors',
      foreignKey: 'hospitalId',
      otherKey: 'doctorId',
      as: 'doctors'
    })
  }

  return Hospital
}
```

> **Note:** if internal's `hospitals` table has additional columns external doesn't read, leaving them out of this file is fine — Sequelize ignores columns it doesn't define. If external later needs them, add. Confirm against `fsg_internal_backend/src/db/models/hospital.model.js` for any column attributes referenced by the SQL queries in Layer 3.

- [ ] **Step 2: Verify parse**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/hospital.model.js
```

**PAUSE for approval.**

---

## Task 10: Add `patient.model.js` (external)

**Files:**
- Create: `fsg_client_backend/src/db/models/patient.model.js`

- [ ] **Step 1: Write the file (mirrors internal subset)**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name'
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_of_birth'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'patients',
    schema: 'public',
    timestamps: true
  })

  Patient.associate = models => {
    Patient.hasOne(models.User, {
      foreignKey: 'patientId',
      as: 'user'
    })
    Patient.belongsToMany(models.Doctor, {
      through: 'patient_doctors',
      foreignKey: 'patientId',
      otherKey: 'doctorId',
      as: 'doctors'
    })
    Patient.belongsToMany(models.Hospital, {
      through: 'patient_hospitals',
      foreignKey: 'patientId',
      otherKey: 'hospitalId',
      as: 'hospitals'
    })
    Patient.hasMany(models.TestResult, {
      foreignKey: 'patientId',
      as: 'testResults'
    })
  }

  return Patient
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/patient.model.js
```

**PAUSE for approval.**

---

## Task 11: Add `formRequest.model.js` (external)

**Files:**
- Create: `fsg_client_backend/src/db/models/formRequest.model.js`

- [ ] **Step 1: Write the file (subset external uses)**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const FormRequest = sequelize.define('FormRequest', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    labId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'lab_id'
    },
    patientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'patient_id'
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'hospital_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'doctor_id'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'form_requests',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  FormRequest.associate = models => {
    FormRequest.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })
    FormRequest.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })
    FormRequest.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
    FormRequest.hasMany(models.TestResult, {
      foreignKey: 'formRequestId',
      as: 'testResults'
    })
  }

  return FormRequest
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/formRequest.model.js
```

**PAUSE for approval.**

---

## Task 12: Add `docInstance.model.js` (external)

**Files:**
- Create: `fsg_client_backend/src/db/models/docInstance.model.js`

- [ ] **Step 1: Write the file**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const DocInstance = sequelize.define('DocInstance', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    testResultId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'test_result_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    pdfFilePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pdf_file_path'
    },
    releasedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'released_date'
    },
    reportedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reported_date'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'doc_instances',
    schema: 'public',
    timestamps: true
  })

  DocInstance.associate = models => {
    DocInstance.belongsTo(models.TestResult, {
      foreignKey: 'testResultId',
      as: 'testResult'
    })
  }

  return DocInstance
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/docInstance.model.js
```

**PAUSE for approval.**

---

## Task 13: Align `doctor.model.js` (external)

**Files:**
- Modify: `fsg_client_backend/src/db/models/doctor.model.js`

- [ ] **Step 1: Read existing**

```bash
cat /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/doctor.model.js
```

Note any existing fields. The replacement keeps the table name and adds the M2M to Patient.

- [ ] **Step 2: Replace contents**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    clinicianName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'clinician_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'doctors',
    schema: 'public',
    timestamps: true
  })

  Doctor.associate = models => {
    Doctor.hasMany(models.User, {
      foreignKey: 'doctorId',
      as: 'users'
    })
    Doctor.belongsToMany(models.Patient, {
      through: 'patient_doctors',
      foreignKey: 'doctorId',
      otherKey: 'patientId',
      as: 'patients'
    })
    Doctor.belongsToMany(models.Hospital, {
      through: 'hospital_doctors',
      foreignKey: 'doctorId',
      otherKey: 'hospitalId',
      as: 'hospitals'
    })
  }

  return Doctor
}
```

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/doctor.model.js
```

**PAUSE for approval.**

---

## Task 14: Align `testCategory.model.js` (external)

**Files:**
- Modify: `fsg_client_backend/src/db/models/testCategory.model.js`

- [ ] **Step 1: Replace contents (mirrors internal + 5 new columns)**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const TestCategory = sequelize.define('TestCategory', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    testCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'test_code'
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'test_name'
    },
    tat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'tat'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    testCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'test_category'
    },
    methodology: {
      type: DataTypes.STRING,
      allowNull: true
    },
    specimenType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'specimen_type'
    },
    transportationTemperature: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'transportation_temperature'
    },
    isReferral: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_referral'
    },
    referralLab: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referral_lab'
    },
    referralLabTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referral_lab_tat'
    },
    proposedInternalTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'proposed_internal_tat'
    },
    testSubCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'test_sub_category'
    },
    financeDepartment: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'finance_department'
    },
    outsourceLabTestCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'outsource_lab_test_code'
    },
    storageStability: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'storage_stability'
    },
    clientTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'client_tat'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'test_categories',
    schema: 'public',
    timestamps: true
  })

  return TestCategory
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/testCategory.model.js
```

**PAUSE for approval.**

---

## Task 15: Align `testResult.model.js` (external)

**Files:**
- Modify: `fsg_client_backend/src/db/models/testResult.model.js`

- [ ] **Step 1: Replace contents (subset external reads)**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      field: 'uuid'
    },
    patientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'patient_id'
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'hospital_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'doctor_id'
    },
    formRequestId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'form_request_id'
    },
    testCategoryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'test_category_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    labStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lab_status'
    },
    turnAroundTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'turn_around_time'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'test_results',
    schema: 'public',
    timestamps: true
  })

  TestResult.associate = models => {
    TestResult.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })
    TestResult.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })
    TestResult.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
    TestResult.belongsTo(models.FormRequest, {
      foreignKey: 'formRequestId',
      as: 'formRequest'
    })
    TestResult.belongsTo(models.TestCategory, {
      foreignKey: 'testCategoryId',
      as: 'testCategory'
    })
    TestResult.hasMany(models.DocInstance, {
      foreignKey: 'testResultId',
      as: 'docInstances'
    })
  }

  return TestResult
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/testResult.model.js
```

**PAUSE for approval.**

---

## Task 16: Align `user.model.js` (external)

**Files:**
- Modify: `fsg_client_backend/src/db/models/user.model.js`

- [ ] **Step 1: Replace contents**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    userRoleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_role_id'
    },
    accountType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_type'
    },
    patientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
      field: 'patient_id'
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'hospital_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'doctor_id'
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name'
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'email_verified'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    encryptedPassword: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'encrypted_password'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_code'
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'phone_verified'
    },
    profileImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_image_url'
    },
    signInCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sign_in_count'
    },
    signInIp: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'sign_in_ip'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  User.associate = models => {
    User.belongsTo(models.UserRole, {
      foreignKey: 'userRoleId',
      as: 'role'
    })
    User.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })
    User.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })
    User.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
    User.hasMany(models.UserToken, {
      foreignKey: 'userId',
      as: 'tokens'
    })
    User.hasMany(models.ContactRequest, {
      foreignKey: 'userId',
      as: 'contactRequests'
    })
  }

  return User
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/user.model.js
```

**PAUSE for approval.**

---

## Task 17: Align `userRole.model.js` (external)

**Files:**
- Modify: `fsg_client_backend/src/db/models/userRole.model.js`

- [ ] **Step 1: Replace contents**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roleType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'role_type'
    },
    permission: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'user_roles',
    schema: 'public',
    timestamps: true
  })

  UserRole.associate = models => {
    UserRole.hasMany(models.User, {
      foreignKey: 'userRoleId',
      as: 'users'
    })
  }

  return UserRole
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/db/models/userRole.model.js
```

**PAUSE for approval.**

---

## Task 18: Restore boot — fix any remaining model-import casualties, then commit the model layer

**Goal:** at this point external boot will likely fail due to importers of the dropped models. Find them, neutralize them (or update if they're trivial), then commit the entire model layer.

- [ ] **Step 1: Try a boot of the external app**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
NODE_ENV=development npm run start 2>&1 | head -60
```

Expect: `Error: Cannot find module './corporate.model'` or similar from `db/models/index.js` if any code references the dropped paths. Or AssociationError from a model.associate referencing a missing model.

- [ ] **Step 2: List current importers of dropped names**

```bash
grep -RnE "models\.(Individual|Corporate|Category|Clinic)\b|individualRepository|corporateRepository|fileAuthorization\.middleware|IIndividualRepository|ICorporateRepository" /home/kia/Desktop/work/fsg/fsg_client_backend/src
```

These will be cleaned up in later tasks (repos in Task 19, services/controllers in Layer 3+, middleware in Task 44, fileDownload.controller in Task 43). For now, the bare minimum to get boot to succeed is just to ensure `db/models/index.js` doesn't try to load the deleted files (it doesn't — it reads the directory dynamically), and that no other model file's `.associate` references a dropped model.

If `db/models/paymentTransaction.model.js` has `.associate` pointing at User/Corporate/Individual — open it and remove the dead refs (don't refactor more than necessary).

- [ ] **Step 3: Re-attempt boot**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
NODE_ENV=development npm run start 2>&1 | head -60
```

If still failing, the failure points to the next file to fix. Apply the smallest neutralization (delete stale .associate lines; do NOT touch service code yet). Repeat until boot succeeds.

- [ ] **Step 4: Once boot succeeds, verify the model registry**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
node -e "const db = require('./src/db/models').default; console.log(Object.keys(db).sort().join('\n'))" 2>/dev/null || \
node --experimental-vm-modules -e "import('./src/db/models/index.js').then(m => console.log(Object.keys(m.default).sort().join('\n')))"
```

Expect output containing: `ContactRequest, Doctor, DocInstance, FormRequest, Hospital, Patient, PaymentTransaction, TestCategory, TestResult, User, UserRole, UserToken, sequelize, Sequelize`. *(If the existing tooling uses Babel transform via npm script, use that script instead — adapt the command accordingly.)*

- [ ] **Step 5: Commit the model layer**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add -A src/db/models src/domain/repositories
git commit -m "refactor(models): align external models to internal shared DB

Drop legacy: Corporate, Individual, Clinic, Category models and
ICorporateRepository/IIndividualRepository interfaces.

Add: Hospital, Patient, FormRequest, DocInstance models matching
internal's schema subset that external reads.

Align: Doctor, TestCategory, TestResult, User (with accountType),
UserRole. TestResult FKs (patientId, hospitalId, doctorId) are
now NOT NULL on the internal side and used directly for
ownership-scoped queries.

Boot is restored. Repository, service, controller, route layers
follow."
```

**PAUSE for approval.**

---

# Layer 1D — External repositories

## Task 19: Drop `corporateRepository.js` and `individualRepository.js`

**Files:**
- Delete: `fsg_client_backend/src/infrastructure/repositories/corporateRepository.js`
- Delete: `fsg_client_backend/src/infrastructure/repositories/individualRepository.js`

- [ ] **Step 1: Confirm no imports left after model layer**

```bash
grep -RnE "corporateRepository|individualRepository" /home/kia/Desktop/work/fsg/fsg_client_backend/src
```

Likely returns hits from old services we'll delete in Layer 3. They'll be addressed there. For now, delete the repo files; their callers will fail with `MODULE_NOT_FOUND` (which is louder than a silent type error and easier to find).

- [ ] **Step 2: Delete**

```bash
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/corporateRepository.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/individualRepository.js
```

- [ ] **Step 3: Stage**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git rm src/infrastructure/repositories/corporateRepository.js src/infrastructure/repositories/individualRepository.js
```

Commit lands in Task 27.

**PAUSE for approval.**

---

## Task 20: Refactor `userRepository.js`

**Files:**
- Modify: `fsg_client_backend/src/infrastructure/repositories/userRepository.js`

- [ ] **Step 1: Replace `findByUserNameOrPhoneAndTypeWithUserRole` with `findByUserNameOrPhoneWithRoleIn`**

The new method filters on `UserRole.roleType IN (...)` instead of `User.userType = ?`. Old method (lines 32-66 currently) is replaced.

- [ ] **Step 2: Rename `corporateId` references to `hospitalId`**

Search for `corporateId` in the file; replace each with `hospitalId`. The default attributes list on line 10 currently includes `'corporateId'` — change to `'hospitalId'`.

- [ ] **Step 3: Replace the file with the aligned version**

```js
import IUserRepository from '../../domain/repositories/IUserRepository'
import models from '../../db/models'
import { Op } from 'sequelize'
import Logger from '../../libs/logger'

export default class UserRepository extends IUserRepository {
  static async findById (id, options = {}) {
    const { User: UserModel } = models
    const { attributes = ['id', 'uuid', 'doctorId', 'hospitalId', 'patientId', 'accountType'] } = options

    const user = await UserModel.findByPk(id, { attributes, raw: true })

    Logger.info('UserRepository: ', { message: 'findById', context: { id: JSON.stringify(id), result: JSON.stringify(user) } })
    return user
  }

  static async findByIdWithRoles (id, options = {}) {
    const { User: UserModel, UserRole: UserRoleModel } = models
    const {
      attributes = ['id', 'uuid', 'accountType', 'hospitalId', 'doctorId', 'patientId'],
      roleAttributes = ['permission', 'roleType']
    } = options

    const user = await UserModel.findByPk(id, {
      attributes,
      include: { model: UserRoleModel, as: 'role', attributes: roleAttributes },
      raw: true,
      nest: true
    })

    Logger.info('UserRepository: ', { message: 'findByIdWithRoles', context: { id: JSON.stringify(id), result: JSON.stringify(user) } })
    return user
  }

  static async findByUserNameOrPhoneWithRoleIn (userNameOrPhone, roleTypes, options = {}) {
    const { User: UserModel, UserRole: UserRoleModel } = models
    const {
      attributes = ['id', 'uuid', 'phone', 'userName', 'firstName', 'lastName', 'email', 'encryptedPassword', 'phoneVerified', 'signInCount', 'accountType', 'hospitalId', 'doctorId', 'patientId'],
      roleAttributes = ['id', 'name', 'roleType', 'permission']
    } = options

    const whereCondition = {
      [Op.or]: [
        { userName: userNameOrPhone },
        { phone: userNameOrPhone }
      ]
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      attributes,
      include: [{
        model: UserRoleModel,
        as: 'role',
        attributes: roleAttributes,
        where: { roleType: { [Op.in]: roleTypes } },
        required: true
      }],
      raw: true,
      nest: true
    })

    Logger.info('UserRepository: ', {
      message: 'findByUserNameOrPhoneWithRoleIn',
      context: { userNameOrPhone: JSON.stringify(userNameOrPhone), roleTypes: JSON.stringify(roleTypes), found: JSON.stringify(!!user) }
    })

    return user
  }

  static async findByUserNameOrPhone (userNameOrPhone, options = {}) {
    const { User: UserModel } = models
    const { attributes = ['id', 'uuid', 'phone', 'userName'] } = options

    const user = await UserModel.findOne({
      where: {
        [Op.or]: [
          { userName: userNameOrPhone },
          { phone: userNameOrPhone }
        ]
      },
      attributes,
      raw: true
    })

    Logger.info('UserRepository: ', { message: 'findByUserNameOrPhone', context: { found: JSON.stringify(!!user) } })
    return user
  }

  static async update (id, updateData, transaction) {
    const { User: UserModel } = models
    const [affectedRows] = await UserModel.update(updateData, { where: { id }, transaction })

    Logger.info('UserRepository: ', { message: 'update', context: { id: JSON.stringify(id), affectedRows: JSON.stringify(affectedRows) } })

    if (affectedRows === 0) return null
    return await this.findById(id)
  }
}
```

> **Note:** if the existing file has additional methods (e.g., `create`, `findByEmail`), preserve them — only the listed methods change. Run `git diff` to confirm before committing. The plan shows the four methods that matter for this refactor; do not delete unrelated methods.

- [ ] **Step 4: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/userRepository.js
```

**PAUSE for approval.**

---

## Task 21: Refactor `testResultRepository.js`

**Files:**
- Modify: `fsg_client_backend/src/infrastructure/repositories/testResultRepository.js`

- [ ] **Step 1: Read existing**

```bash
sed -n '1,80p' /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/testResultRepository.js
```

Note any references to `corporateId`/`individualId`/`categoryId` — these become `hospitalId`/`patientId`/`testCategoryId`.

- [ ] **Step 2: Replace contents (focused subset for sub-projects 1+3)**

```js
import ITestResultRepository from '../../domain/repositories/ITestResultRepository'
import models from '../../db/models'
import { Op } from 'sequelize'
import Logger from '../../libs/logger'

export default class TestResultRepository extends ITestResultRepository {
  /**
   * Distinct patients linked to the actor's owner column.
   * Used by getMyPatients (corporate / doctor).
   */
  static async findDistinctPatientsByOwner (ownerColumn, ownerValue, { limit, offset, search } = {}) {
    const { TestResult: TestResultModel, Patient: PatientModel, User: UserModel } = models

    const where = { [ownerColumn]: ownerValue }
    const patientWhere = {}
    if (search) {
      patientWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } }
      ]
    }

    const rows = await TestResultModel.findAll({
      where,
      attributes: [],
      include: [{
        model: PatientModel,
        as: 'patient',
        required: true,
        where: patientWhere,
        attributes: ['uuid', 'firstName', 'lastName', 'dateOfBirth', 'email'],
        include: [{
          model: UserModel,
          as: 'user',
          attributes: ['phone'],
          required: false
        }]
      }],
      group: ['patient.id', 'patient.user.id'],
      limit,
      offset,
      order: [[{ model: PatientModel, as: 'patient' }, 'created_at', 'DESC']],
      raw: true,
      nest: true
    })

    Logger.info('TestResultRepository: ', { message: 'findDistinctPatientsByOwner', context: { ownerColumn, ownerValue: JSON.stringify(ownerValue), count: JSON.stringify(rows.length) } })
    return rows
  }

  /**
   * Completed + released tests for a specific patient, scoped by the actor's owner column.
   * Used by getPatientReport.
   */
  static async findCompletedReleasedForPatientScoped (patientUuid, ownerColumn, ownerValue, { limit, offset } = {}) {
    const { TestResult: TestResultModel, Patient: PatientModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel } = models

    const rows = await TestResultModel.findAll({
      where: {
        [ownerColumn]: ownerValue,
        status: 'completed',
        labStatus: 'RECORD_MANAGEMENT'
      },
      attributes: ['uuid', 'createdAt'],
      include: [
        {
          model: PatientModel,
          as: 'patient',
          required: true,
          where: { uuid: patientUuid },
          attributes: ['uuid', 'firstName', 'lastName']
        },
        {
          model: TestCategoryModel,
          as: 'testCategory',
          attributes: ['testName', 'methodology']
        },
        {
          model: DocInstanceModel,
          as: 'docInstances',
          required: true,
          where: { status: 'RELEASED' },
          attributes: ['uuid', 'releasedDate']
        }
      ],
      order: [[{ model: DocInstanceModel, as: 'docInstances' }, 'released_date', 'DESC']],
      limit,
      offset,
      raw: true,
      nest: true
    })

    Logger.info('TestResultRepository: ', { message: 'findCompletedReleasedForPatientScoped', context: { patientUuid, ownerColumn, count: JSON.stringify(rows.length) } })
    return rows
  }

  /**
   * All tests for a patient, regardless of doc instance status.
   * Used by getMyReportStatus (patient self-view).
   */
  static async findAllForPatient (patientId, { limit, offset } = {}) {
    const { TestResult: TestResultModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel } = models

    const rows = await TestResultModel.findAll({
      where: { patientId },
      attributes: ['uuid', 'createdAt', 'status', 'turnAroundTime'],
      include: [
        {
          model: TestCategoryModel,
          as: 'testCategory',
          attributes: ['testName', 'methodology']
        },
        {
          model: DocInstanceModel,
          as: 'docInstances',
          attributes: ['uuid'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      raw: true,
      nest: true
    })

    Logger.info('TestResultRepository: ', { message: 'findAllForPatient', context: { patientId: JSON.stringify(patientId), count: JSON.stringify(rows.length) } })
    return rows
  }
}
```

> **Note:** if the existing file has methods used by services we're keeping (e.g., dashboard or transactions paths not in this spec), preserve them. The replacement above shows the methods needed by Layer 3 services; merge in any survivors after.

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/testResultRepository.js
```

**PAUSE for approval.**

---

## Task 22: Add `hospitalRepository.js`

**Files:**
- Create: `fsg_client_backend/src/infrastructure/repositories/hospitalRepository.js`

- [ ] **Step 1: Write the file**

```js
import IHospitalRepository from '../../domain/repositories/IHospitalRepository'
import models from '../../db/models'
import Logger from '../../libs/logger'

export default class HospitalRepository extends IHospitalRepository {
  static async findById (id, options = {}) {
    const { Hospital: HospitalModel } = models
    const { attributes = ['id', 'uuid', 'hospitalName'] } = options

    const hospital = await HospitalModel.findByPk(id, { attributes, raw: true })

    Logger.info('HospitalRepository: ', { message: 'findById', context: { id: JSON.stringify(id), found: JSON.stringify(!!hospital) } })
    return hospital
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/hospitalRepository.js
```

**PAUSE for approval.**

---

## Task 23: Add `patientRepository.js`

**Files:**
- Create: `fsg_client_backend/src/infrastructure/repositories/patientRepository.js`

- [ ] **Step 1: Write the file**

```js
import IPatientRepository from '../../domain/repositories/IPatientRepository'
import models from '../../db/models'
import Logger from '../../libs/logger'

export default class PatientRepository extends IPatientRepository {
  static async findById (id, options = {}) {
    const { Patient: PatientModel } = models
    const { attributes = ['id', 'uuid', 'firstName', 'lastName'] } = options

    const patient = await PatientModel.findByPk(id, { attributes, raw: true })

    Logger.info('PatientRepository: ', { message: 'findById', context: { id: JSON.stringify(id), found: JSON.stringify(!!patient) } })
    return patient
  }

  static async findByUuid (uuid, options = {}) {
    const { Patient: PatientModel } = models
    const { attributes = ['id', 'uuid', 'firstName', 'lastName'] } = options

    const patient = await PatientModel.findOne({ where: { uuid }, attributes, raw: true })

    Logger.info('PatientRepository: ', { message: 'findByUuid', context: { uuid, found: JSON.stringify(!!patient) } })
    return patient
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/patientRepository.js
```

**PAUSE for approval.**

---

## Task 24: Add `docInstanceRepository.js`

**Files:**
- Create: `fsg_client_backend/src/infrastructure/repositories/docInstanceRepository.js`

- [ ] **Step 1: Write the file**

```js
import IDocInstanceRepository from '../../domain/repositories/IDocInstanceRepository'
import models from '../../db/models'
import Logger from '../../libs/logger'

export default class DocInstanceRepository extends IDocInstanceRepository {
  /**
   * Single-query authz lookup. Returns the doc instance only if:
   *   - uuid matches
   *   - status is 'RELEASED'
   *   - the test_result the doc belongs to has the actor's owner column = ownerValue
   * Used by downloadReport. Defense-in-depth: filter at SQL source.
   */
  static async findReleasedByUuidScoped (uuid, ownerColumn, ownerValue, options = {}) {
    const { DocInstance: DocInstanceModel, TestResult: TestResultModel } = models
    const { attributes = ['id', 'uuid', 'status', 'pdfFilePath'] } = options

    const docInstance = await DocInstanceModel.findOne({
      where: { uuid, status: 'RELEASED' },
      attributes,
      include: [{
        model: TestResultModel,
        as: 'testResult',
        required: true,
        where: { [ownerColumn]: ownerValue },
        attributes: []
      }],
      raw: true,
      nest: true
    })

    Logger.info('DocInstanceRepository: ', {
      message: 'findReleasedByUuidScoped',
      context: { uuid, ownerColumn, ownerValue: JSON.stringify(ownerValue), found: JSON.stringify(!!docInstance) }
    })
    return docInstance
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/docInstanceRepository.js
```

**PAUSE for approval.**

---

## Task 25: Refactor `testCategoryRepository.js`

**Files:**
- Modify: `fsg_client_backend/src/infrastructure/repositories/testCategoryRepository.js`

- [ ] **Step 1: Replace contents**

```js
import ITestCategoryRepository from '../../domain/repositories/ITestCategoryRepository'
import models from '../../db/models'
import { Op } from 'sequelize'
import Logger from '../../libs/logger'

export default class TestCategoryRepository extends ITestCategoryRepository {
  static async findAll ({ limit, offset, search } = {}) {
    const { TestCategory: TestCategoryModel } = models

    const where = {}
    if (search) {
      where[Op.or] = [
        { testName: { [Op.iLike]: `%${search}%` } },
        { testCode: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const { rows, count } = await TestCategoryModel.findAndCountAll({
      where,
      attributes: ['testName', 'testCode', 'tat'],
      order: [['test_name', 'ASC']],
      limit,
      offset,
      raw: true
    })

    Logger.info('TestCategoryRepository: ', { message: 'findAll', context: { limit: JSON.stringify(limit), offset: JSON.stringify(offset), count: JSON.stringify(count) } })
    return { rows, count }
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/infrastructure/repositories/testCategoryRepository.js
```

**PAUSE for approval.**

---

## Task 26: Add/align domain interfaces

**Files:**
- Create: `fsg_client_backend/src/domain/repositories/IHospitalRepository.js`
- Create: `fsg_client_backend/src/domain/repositories/IPatientRepository.js`
- Create: `fsg_client_backend/src/domain/repositories/IDocInstanceRepository.js`
- Modify: `fsg_client_backend/src/domain/repositories/IUserRepository.js`
- Modify: `fsg_client_backend/src/domain/repositories/ITestResultRepository.js`
- Modify: `fsg_client_backend/src/domain/repositories/ITestCategoryRepository.js`

- [ ] **Step 1: Add `IHospitalRepository.js`**

```js
export default class IHospitalRepository {
  static async findById (id, options) { throw new Error('Not implemented') }
}
```

- [ ] **Step 2: Add `IPatientRepository.js`**

```js
export default class IPatientRepository {
  static async findById (id, options)   { throw new Error('Not implemented') }
  static async findByUuid (uuid, options) { throw new Error('Not implemented') }
}
```

- [ ] **Step 3: Add `IDocInstanceRepository.js`**

```js
export default class IDocInstanceRepository {
  static async findReleasedByUuidScoped (uuid, ownerColumn, ownerValue, options) {
    throw new Error('Not implemented')
  }
}
```

- [ ] **Step 4: Update `IUserRepository.js`**

Replace contents with:

```js
export default class IUserRepository {
  static async findById (id, options)               { throw new Error('Not implemented') }
  static async findByIdWithRoles (id, options)      { throw new Error('Not implemented') }
  static async findByUserNameOrPhoneWithRoleIn (userNameOrPhone, roleTypes, options) {
    throw new Error('Not implemented')
  }
  static async findByUserNameOrPhone (userNameOrPhone, options) {
    throw new Error('Not implemented')
  }
  static async update (id, updateData, transaction) { throw new Error('Not implemented') }
}
```

- [ ] **Step 5: Update `ITestResultRepository.js`**

Replace contents with:

```js
export default class ITestResultRepository {
  static async findDistinctPatientsByOwner (ownerColumn, ownerValue, options) {
    throw new Error('Not implemented')
  }
  static async findCompletedReleasedForPatientScoped (patientUuid, ownerColumn, ownerValue, options) {
    throw new Error('Not implemented')
  }
  static async findAllForPatient (patientId, options) {
    throw new Error('Not implemented')
  }
}
```

- [ ] **Step 6: Update `ITestCategoryRepository.js`**

```js
export default class ITestCategoryRepository {
  static async findAll (options) { throw new Error('Not implemented') }
}
```

- [ ] **Step 7: Verify all parse**

```bash
for f in /home/kia/Desktop/work/fsg/fsg_client_backend/src/domain/repositories/*.js; do
  node --check "$f" || echo "FAILED: $f"
done
```

**PAUSE for approval.**

---

## Task 27: Boot smoke + commit Layer 1D

- [ ] **Step 1: Try boot**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
NODE_ENV=development npm run start 2>&1 | head -60
```

If boot fails on something importing `corporateRepository`/`individualRepository`/`fileAuthorization.middleware` from a Layer 3+ file (services, controllers, routes), neutralize that consumer (comment out the route registration, or temporarily delete the unused file). Note the path for proper cleanup in later tasks. Goal here: get to "Server running on …" output.

- [ ] **Step 2: Verify the new repos load**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
node -e "
require('./node_modules/@babel/register')({ presets: [['@babel/preset-env', { targets: { node: 'current' } }]] });
const HospitalRepo = require('./src/infrastructure/repositories/hospitalRepository').default;
const PatientRepo = require('./src/infrastructure/repositories/patientRepository').default;
const DocRepo = require('./src/infrastructure/repositories/docInstanceRepository').default;
console.log('Hospital:', typeof HospitalRepo.findById);
console.log('Patient:', typeof PatientRepo.findByUuid);
console.log('DocInstance:', typeof DocRepo.findReleasedByUuidScoped);
" 2>/dev/null || echo "(skip if babel not preinstalled — boot success is enough)"
```

- [ ] **Step 3: Commit Layer 1D**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add -A src/infrastructure/repositories src/domain/repositories
git commit -m "refactor(repos): align external repositories to shared DB

Drop: corporateRepository, individualRepository.
Add:  hospitalRepository (findById), patientRepository (findById,
      findByUuid), docInstanceRepository
      (findReleasedByUuidScoped — single-query SQL filter for
      download authz).
Refactor: userRepository (findByUserNameOrPhoneWithRoleIn replaces
      findByUserNameOrPhoneAndTypeWithUserRole), testResultRepository
      (new methods for getMyPatients / getPatientReport / getMyReportStatus),
      testCategoryRepository (findAll for catalog).
Domain interfaces aligned."
```

**PAUSE for approval.**

---

# Layer 2 — AJV / supporting libs

## Task 28: Replace `permissions.js`

**Files:**
- Modify: `fsg_client_backend/src/libs/permissions.js`

- [ ] **Step 1: Replace contents**

```js
// Request Type maps HTTP method to permission action
export const REQUEST_TYPE = {
  GET: 'R',
  POST: 'C',
  PUT: 'U',
  PATCH: 'U',
  DELETE: 'D',
  TOGGLE: 'T'
}

// Endpoint to Module mapper
export const PERMISSION_TYPE = {
  CORPORATE: 'CORPORATE',
  DOCTOR:    'DOCTOR',
  PATIENT:   'PATIENT',
  PAYMENT:   'PAYMENT',
  REPORTS:   'REPORTS',

  aliases: {
    // hospital-account routes (URL prefix /corporate/* per Q2)
    'corporate/patients':       'CORPORATE',
    'corporate/patient-report': 'REPORTS',
    'corporate/test-catalog':   'CORPORATE',

    // doctor routes
    'doctor/patients':       'DOCTOR',
    'doctor/patient-report': 'REPORTS',
    'doctor/test-catalog':   'DOCTOR',

    // patient routes
    'patient/report-status': 'PATIENT',

    // shared download
    'reports/download': 'REPORTS'
  }
}

export const PERMISSIONS = {
  CORPORATE: ['R'],
  DOCTOR:    ['R'],
  PATIENT:   ['R'],
  PAYMENT:   ['R'],
  REPORTS:   ['R']
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/libs/permissions.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/libs/permissions.js
git commit -m "refactor(permissions): align modules to internal seed vocabulary

Drop legacy COPORATE typo, INDIVIDUAL, TRANSACTION; replace aliases
with the new endpoint→module map. CORPORATE matches the seeded
user_roles.permission JSONB."
```

**PAUSE for approval.**

---

## Task 29: Add `resolveOwnerScope.js`

**Files:**
- Create: `fsg_client_backend/src/libs/resolveOwnerScope.js`

- [ ] **Step 1: Write the file**

```js
/**
 * Pure helper: maps an authenticated user's accountType to the
 * test_results column + value used to scope ownership-based queries.
 * Returns null for unknown accountTypes (caller should treat as deny).
 */
export const resolveOwnerScope = (user) => {
  switch (user?.accountType) {
    case 'corporate': return { column: 'hospital_id', value: user.hospitalId }
    case 'doctor':    return { column: 'doctor_id',   value: user.doctorId   }
    case 'patient':   return { column: 'patient_id',  value: user.patientId  }
    default:          return null
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/libs/resolveOwnerScope.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/libs/resolveOwnerScope.js
git commit -m "feat(libs): add resolveOwnerScope helper

Pure function maps user.accountType to the test_results column
and FK value used by ownership-scoped queries. Used by
downloadReport, getMyPatients, getPatientReport,
validateUserAccountLink."
```

**PAUSE for approval.**

---

## Task 30: Update `errorTypes.js`

**Files:**
- Modify: `fsg_client_backend/src/libs/errorTypes.js`

- [ ] **Step 1: Find existing types and the next free errorCode**

```bash
grep -nE "errorCode" /home/kia/Desktop/work/fsg/fsg_client_backend/src/libs/errorTypes.js | tail -5
```

Pick error codes that don't collide. Below uses `41xx` range — adjust to whatever is free.

- [ ] **Step 2: Append new types at the bottom of the file**

```js
import { StatusCodes } from 'http-status-codes'

// ... existing error types above ...

export const AccountNotLinkedErrorType = {
  name: 'AccountNotLinked',
  statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
  isOperational: true,
  description: 'Account is not linked to an entity for its account type.',
  errorCode: 4101
}

export const AccountLinkBrokenErrorType = {
  name: 'AccountLinkBroken',
  statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
  isOperational: true,
  description: 'Account references an entity that no longer exists.',
  errorCode: 4102
}

export const DocInstanceNotFoundErrorType = {
  name: 'DocInstanceNotFound',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The requested document is not available.',
  errorCode: 4103
}

export const PdfNotGeneratedErrorType = {
  name: 'PdfNotGenerated',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The PDF for this document has not been generated yet.',
  errorCode: 4104
}
```

> **Note:** `import { StatusCodes }` should already be at the top of the file (existing types use it). Don't duplicate. Pick errorCode integers that are next-available; `41xx` is illustrative.

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/libs/errorTypes.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/libs/errorTypes.js
git commit -m "feat(errors): add types for account link + download flows

AccountNotLinkedErrorType (FK is null), AccountLinkBrokenErrorType
(FK doesn't resolve), DocInstanceNotFoundErrorType (covers missing,
not-released, not-yours, traversal-fail — enumeration-resistant),
PdfNotGeneratedErrorType (row exists, file path null)."
```

**PAUSE for approval.**

---

# Layer 3 — Services

## Task 31: Add `validateUserAccountLink.service.js`

**Files:**
- Create: `fsg_client_backend/src/services/user/validateUserAccountLink.service.js`

- [ ] **Step 1: Write the file**

```js
import ServiceBase from '../../libs/serviceBase'
import HospitalRepository from '../../infrastructure/repositories/hospitalRepository'
import DoctorRepository   from '../../infrastructure/repositories/doctorRepository'
import PatientRepository  from '../../infrastructure/repositories/patientRepository'
import ajv from '../../libs/ajv'
import { resolveOwnerScope } from '../../libs/resolveOwnerScope'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        accountType: { type: 'string', enum: ['corporate', 'patient', 'doctor'] },
        hospitalId:  { type: ['number', 'string', 'null'] },
        doctorId:    { type: ['number', 'string', 'null'] },
        patientId:   { type: ['number', 'string', 'null'] }
      },
      required: ['accountType']
    }
  },
  required: ['user']
}

const constraints = ajv.compile(schema)

const REPO_BY_TYPE = {
  corporate: HospitalRepository,
  doctor:    DoctorRepository,
  patient:   PatientRepository
}

export default class ValidateUserAccountLinkService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { user } = this.args

    Logger.info('ValidateUserAccountLinkService: ', { message: 'entry', context: { accountType: JSON.stringify(user.accountType), userId: JSON.stringify(user.id) } })

    const scope = resolveOwnerScope(user)
    if (!scope || scope.value == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const repo = REPO_BY_TYPE[user.accountType]
    const entity = await repo.findById(scope.value, { attributes: ['id'] })

    if (!entity) {
      return this.addError('AccountLinkBrokenErrorType')
    }

    Logger.info('ValidateUserAccountLinkService: ', { message: 'success', context: { column: scope.column, id: JSON.stringify(scope.value) } })
    return { column: scope.column, id: scope.value }
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/user/validateUserAccountLink.service.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/user/validateUserAccountLink.service.js
git commit -m "feat(user): add ValidateUserAccountLinkService

Called from login after credentials check. Confirms the user's
accountType FK resolves to a real entity. Two-tier failure modes:
AccountNotLinkedErrorType (FK null), AccountLinkBrokenErrorType
(FK points to deleted row). Per-request paranoid mode is out of
scope; this is one-time per session."
```

**PAUSE for approval.**

---

## Task 32: Refactor `login.service.js`

**Files:**
- Modify: `fsg_client_backend/src/services/user/login.service.js`

- [ ] **Step 1: Replace contents**

```js
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ajv from '../../libs/ajv'
import config from '../../configs/app.config'
import ServiceBase from '../../libs/serviceBase'
import { setData } from '../../helpers/redis.helpers'
import { getUserTokenCacheKey } from '../../utils/user.utils'
import UserRepository from '../../infrastructure/repositories/userRepository'
import ValidateUserAccountLinkService from './validateUserAccountLink.service'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    userNameOrPhone: { type: 'string' },
    password:        { type: 'string' },
    accountType:     { type: 'string', enum: ['corporate', 'patient', 'doctor'] }
  },
  required: ['userNameOrPhone', 'password', 'accountType']
}

const constraints = ajv.compile(schema)

const ACCOUNT_TYPE_TO_ROLE_TYPES = {
  corporate: ['CORPORATE', 'PAYMENT'],
  patient:   ['PATIENT'],
  doctor:    ['DOCTOR']
}

export default class LoginService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { sequelizeTransaction } = this.context

    Logger.info('LoginService: ', { message: 'entry', context: { accountType: JSON.stringify(this.args.accountType), userNameOrPhone: JSON.stringify(this.args.userNameOrPhone) } })

    const userNameOrPhone = this.args.userNameOrPhone?.trim()?.toLowerCase?.()
    const password = this.args.password?.trim()
    const roleTypes = ACCOUNT_TYPE_TO_ROLE_TYPES[this.args.accountType]

    const user = await UserRepository.findByUserNameOrPhoneWithRoleIn(userNameOrPhone, roleTypes)

    if (!user) return this.addError('UserNotExistsErrorType')
    if (!user.encryptedPassword) return this.addError('PasswordExpiredErrorType')

    const passwordOk = await this.isValidPassword(user.encryptedPassword, password)
    if (!passwordOk) return this.addError('InvalidCredentialsErrorType')

    // OTP / phone-verified gate intentionally removed.
    // generateCode + phone services remain in the codebase, just unwired.

    const linkResult = await ValidateUserAccountLinkService.run({ user }, this.context)
    if (!linkResult) return null   // ServiceBase will surface the underlying error

    await UserRepository.update(user.id, {
      signInCount: user.signInCount + 1,
      lastLogin: new Date()
    }, sequelizeTransaction)

    const accessToken = jwt.sign(
      { id: user.id, phone: user.phone },
      config.get('jwt.loginTokenSecret'),
      { expiresIn: config.get('jwt.loginTokenExpiry') }
    )

    setData(getUserTokenCacheKey(user.id), accessToken, config.get('jwt.loginTokenExpiry'))

    Logger.info('LoginService: ', { message: 'success', context: { userId: JSON.stringify(user.id), accountType: JSON.stringify(user.accountType) } })

    return { message: 'Authentication successful', accessToken, user }
  }

  async isValidPassword (encryptedPassword, inputPassword) {
    try {
      return await bcrypt.compare(inputPassword, encryptedPassword)
    } catch (error) {
      Logger.error('LoginService: ', { message: `password check failed ${error.message}`, exception: error })
      return false
    }
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/user/login.service.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/user/login.service.js
git commit -m "refactor(user): rewire login for shared DB + accountType DTO

- DTO accepts { accountType: corporate|patient|doctor } (3 values).
- Maps to user_roles.role_type IN [...] (corporate → CORPORATE+PAYMENT).
- Uses new findByUserNameOrPhoneWithRoleIn repo method.
- Drops the phoneVerified OTP gate (services unchanged, just unwired).
- Calls ValidateUserAccountLinkService after credentials check."
```

**PAUSE for approval.**

---

## Task 33: Add `downloadReport.service.js`

**Files:**
- Create: `fsg_client_backend/src/services/recordManagement/downloadReport.service.js`

- [ ] **Step 1: Create the directory if needed and write the file**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/recordManagement
```

Then create the file:

```js
import path from 'path'
import fs from 'fs/promises'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import { resolveOwnerScope } from '../../libs/resolveOwnerScope'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    docInstanceUuid: { type: 'string' }
  },
  required: ['docInstanceUuid']
}

const constraints = ajv.compile(schema)

export default class DownloadReportService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { docInstanceUuid } = this.args
    const user = this.context?.user

    Logger.info('DownloadReportService: ', { message: 'entry', context: { docInstanceUuid, accountType: JSON.stringify(user?.accountType) } })

    const scope = resolveOwnerScope(user)
    if (!scope || scope.value == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const docInstance = await DocInstanceRepository.findReleasedByUuidScoped(
      docInstanceUuid, scope.column, scope.value,
      { attributes: ['id', 'uuid', 'status', 'pdfFilePath'] }
    )

    if (!docInstance) return this.addError('DocInstanceNotFoundErrorType')
    if (!docInstance.pdfFilePath) return this.addError('PdfNotGeneratedErrorType')

    const filePath = path.join(process.cwd(), docInstance.pdfFilePath)

    try {
      await fs.access(filePath)
    } catch (error) {
      Logger.error('DownloadReportService: ', { message: `PDF file not accessible: ${error.message}`, exception: error })
      return this.addError('DocInstanceNotFoundErrorType')
    }

    const realPath = await fs.realpath(filePath)
    const allowedDir = await fs.realpath(path.join(process.cwd(), 'downloads'))

    if (!realPath.startsWith(allowedDir)) {
      Logger.error('DownloadReportService: ', { message: 'path traversal blocked', context: { realPath } })
      return this.addError('DocInstanceNotFoundErrorType')
    }

    Logger.info('DownloadReportService: ', { message: 'success', context: { docInstanceUuid, fileName: path.basename(realPath) } })

    return { filePath: realPath, fileName: path.basename(realPath) }
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/recordManagement/downloadReport.service.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/recordManagement/downloadReport.service.js
git commit -m "feat(recordManagement): add downloadReport service

Single-query authz via DocInstanceRepository.findReleasedByUuidScoped:
the same SQL filters by uuid, status=RELEASED, and the actor's
owner column. All not-found / not-released / not-yours paths return
the same DocInstanceNotFoundErrorType (enumeration-resistant).
Mirrors internal's path-traversal guard under ./downloads."
```

**PAUSE for approval.**

---

## Task 34: Add `getMyPatients.service.js` + presenter

**Files:**
- Create: `fsg_client_backend/src/services/recordManagement/getMyPatients.service.js`
- Create: `fsg_client_backend/src/presenters/recordManagement/getMyPatients.presenter.js`

- [ ] **Step 1: Write the presenter**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/recordManagement
```

```js
// src/presenters/recordManagement/getMyPatients.presenter.js
export const getMyPatientsPresenter = (rows) =>
  rows.map(row => ({
    patientId: row.patient.uuid,
    name: [row.patient.firstName, row.patient.lastName].filter(Boolean).join(' '),
    dob: row.patient.dateOfBirth,
    mobile: row.patient?.user?.phone || null,
    email: row.patient.email
  }))
```

- [ ] **Step 2: Write the service**

```js
// src/services/recordManagement/getMyPatients.service.js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import { resolveOwnerScope } from '../../libs/resolveOwnerScope'
import { getMyPatientsPresenter } from '../../presenters/recordManagement/getMyPatients.presenter'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
    offset: { type: ['number', 'string'], minimum: 0 },
    search: { type: 'string' }
  }
}

const constraints = ajv.compile(schema)

export default class GetMyPatientsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const user = this.context?.user
    const { limit = 20, offset = 0, search } = this.args

    Logger.info('GetMyPatientsService: ', { message: 'entry', context: { accountType: JSON.stringify(user?.accountType), limit: JSON.stringify(limit), offset: JSON.stringify(offset) } })

    const scope = resolveOwnerScope(user)
    if (!scope || scope.value == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const rows = await TestResultRepository.findDistinctPatientsByOwner(
      scope.column, scope.value,
      { limit: Number(limit), offset: Number(offset), search }
    )

    const data = getMyPatientsPresenter(rows)

    Logger.info('GetMyPatientsService: ', { message: 'success', context: { count: JSON.stringify(data.length) } })

    return { message: 'OK', data, count: data.length }
  }
}
```

- [ ] **Step 3: Verify both**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/recordManagement/getMyPatients.service.js
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/recordManagement/getMyPatients.presenter.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/recordManagement/getMyPatients.service.js src/presenters/recordManagement/getMyPatients.presenter.js
git commit -m "feat(recordManagement): getMyPatients service + presenter

Returns distinct patients linked to the actor via test_results
(filtered on hospital_id or doctor_id from accountType). Presenter
yields { patientId, name, dob, mobile, email }."
```

**PAUSE for approval.**

---

## Task 35: Add `getPatientReport.service.js` + presenter

**Files:**
- Create: `fsg_client_backend/src/services/recordManagement/getPatientReport.service.js`
- Create: `fsg_client_backend/src/presenters/recordManagement/getPatientReport.presenter.js`

- [ ] **Step 1: Write the presenter**

```js
// src/presenters/recordManagement/getPatientReport.presenter.js
export const getPatientReportPresenter = (rows) =>
  rows.map(row => ({
    patientId: row.patient.uuid,
    patientName: [row.patient.firstName, row.patient.lastName].filter(Boolean).join(' '),
    createdAt: row.createdAt,
    testDone: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
    reportDate: row.docInstances?.releasedDate || null,
    docInstanceUuid: row.docInstances?.uuid || null
  }))
```

- [ ] **Step 2: Write the service**

```js
// src/services/recordManagement/getPatientReport.service.js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import { resolveOwnerScope } from '../../libs/resolveOwnerScope'
import { getPatientReportPresenter } from '../../presenters/recordManagement/getPatientReport.presenter'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    patientUuid: { type: 'string' },
    limit:       { type: ['number', 'string'], minimum: 1, maximum: 100 },
    offset:      { type: ['number', 'string'], minimum: 0 }
  },
  required: ['patientUuid']
}

const constraints = ajv.compile(schema)

export default class GetPatientReportService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const user = this.context?.user
    const { patientUuid, limit = 20, offset = 0 } = this.args

    Logger.info('GetPatientReportService: ', { message: 'entry', context: { accountType: JSON.stringify(user?.accountType), patientUuid } })

    const scope = resolveOwnerScope(user)
    if (!scope || scope.value == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const rows = await TestResultRepository.findCompletedReleasedForPatientScoped(
      patientUuid, scope.column, scope.value,
      { limit: Number(limit), offset: Number(offset) }
    )

    const data = getPatientReportPresenter(rows)

    Logger.info('GetPatientReportService: ', { message: 'success', context: { count: JSON.stringify(data.length) } })

    return { message: 'OK', data, count: data.length }
  }
}
```

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/recordManagement/getPatientReport.service.js
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/recordManagement/getPatientReport.presenter.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/recordManagement/getPatientReport.service.js src/presenters/recordManagement/getPatientReport.presenter.js
git commit -m "feat(recordManagement): getPatientReport service + presenter

Returns completed/released tests for a patient, scoped by actor's
ownership column. Out-of-scope patients return empty array
(enumeration-resistant). Presenter combines testName-methodology."
```

**PAUSE for approval.**

---

## Task 36: Add `getTestCatalog.service.js` + presenter

**Files:**
- Create: `fsg_client_backend/src/services/testCategory/getTestCatalog.service.js`
- Create: `fsg_client_backend/src/presenters/testCategory/getTestCatalog.presenter.js`

- [ ] **Step 1: Write the presenter**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/testCategory
```

```js
// src/presenters/testCategory/getTestCatalog.presenter.js
export const getTestCatalogPresenter = (rows) =>
  rows.map(row => ({
    testName: row.testName,
    testCode: row.testCode,
    turnAroundTime: row.tat
  }))
```

- [ ] **Step 2: Write the service**

```js
// src/services/testCategory/getTestCatalog.service.js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestCategoryRepository from '../../infrastructure/repositories/testCategoryRepository'
import { getTestCatalogPresenter } from '../../presenters/testCategory/getTestCatalog.presenter'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
    offset: { type: ['number', 'string'], minimum: 0 },
    search: { type: 'string' }
  }
}

const constraints = ajv.compile(schema)

export default class GetTestCatalogService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { limit = 50, offset = 0, search } = this.args

    Logger.info('GetTestCatalogService: ', { message: 'entry', context: { limit: JSON.stringify(limit), offset: JSON.stringify(offset), search: JSON.stringify(search) } })

    const { rows, count } = await TestCategoryRepository.findAll({
      limit: Number(limit),
      offset: Number(offset),
      search
    })

    const data = getTestCatalogPresenter(rows)

    Logger.info('GetTestCatalogService: ', { message: 'success', context: { count: JSON.stringify(count) } })

    return { message: 'OK', data, count }
  }
}
```

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/testCategory/getTestCatalog.service.js
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/testCategory/getTestCatalog.presenter.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/testCategory/getTestCatalog.service.js src/presenters/testCategory/getTestCatalog.presenter.js
git commit -m "feat(testCategory): getTestCatalog service + presenter

Returns the orderable test list for hospital and doctor users.
Same data either role; permission middleware gates access."
```

**PAUSE for approval.**

---

## Task 37: Add `getMyReportStatus.service.js` + presenter

**Files:**
- Create: `fsg_client_backend/src/services/patient/getMyReportStatus.service.js`
- Create: `fsg_client_backend/src/presenters/patient/getMyReportStatus.presenter.js`

- [ ] **Step 1: Write the presenter**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/patient
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/patient
```

```js
// src/presenters/patient/getMyReportStatus.presenter.js
export const getMyReportStatusPresenter = (rows) =>
  rows.map(row => ({
    testName: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
    receivedDate: row.createdAt,
    testStatus: row.status,
    turnAroundTime: row.turnAroundTime,
    docInstanceUuid: row.docInstances?.uuid || null
  }))
```

- [ ] **Step 2: Write the service**

```js
// src/services/patient/getMyReportStatus.service.js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import { getMyReportStatusPresenter } from '../../presenters/patient/getMyReportStatus.presenter'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
    offset: { type: ['number', 'string'], minimum: 0 }
  }
}

const constraints = ajv.compile(schema)

export default class GetMyReportStatusService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const user = this.context?.user
    const { limit = 20, offset = 0 } = this.args

    Logger.info('GetMyReportStatusService: ', { message: 'entry', context: { userId: JSON.stringify(user?.id), patientId: JSON.stringify(user?.patientId) } })

    if (user?.patientId == null) {
      return this.addError('AccountNotLinkedErrorType')
    }

    const rows = await TestResultRepository.findAllForPatient(
      user.patientId,
      { limit: Number(limit), offset: Number(offset) }
    )

    const data = getMyReportStatusPresenter(rows)

    Logger.info('GetMyReportStatusService: ', { message: 'success', context: { count: JSON.stringify(data.length) } })

    return { message: 'OK', data, count: data.length }
  }
}
```

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/patient/getMyReportStatus.service.js
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/presenters/patient/getMyReportStatus.presenter.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/services/patient/getMyReportStatus.service.js src/presenters/patient/getMyReportStatus.presenter.js
git commit -m "feat(patient): getMyReportStatus service + presenter

Patient-only API: returns the journey of every test for the
authenticated patient (no docInstance.status filter — patients
see in-progress tests too)."
```

**PAUSE for approval.**

---

## Task 38: Drop superseded services

**Files:**
- Delete: `fsg_client_backend/src/services/corporate/getCorporatePatients.service.js`
- Delete: `fsg_client_backend/src/services/corporate/getCorporateTestResults.service.js`
- Inspect / maybe delete: `fsg_client_backend/src/services/dashboard/getAllTestResult.service.js`

- [ ] **Step 1: Check whether dashboard service imports a dropped model/repo**

```bash
grep -nE "Individual|Corporate|individualRepository|corporateRepository|categoryId" /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/dashboard/getAllTestResult.service.js
```

If yes → delete in this task. If no → leave it alone (deferred per Q9d).

- [ ] **Step 2: Delete**

```bash
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/corporate/getCorporatePatients.service.js
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/corporate/getCorporateTestResults.service.js
# only if Step 1 showed a dropped-model dependency:
# rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/dashboard/getAllTestResult.service.js
```

- [ ] **Step 3: Stage; controllers/routes referencing them are cleaned in Layer 4–5**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git rm src/services/corporate/getCorporatePatients.service.js src/services/corporate/getCorporateTestResults.service.js
# also git rm dashboard service if deleted above
```

Commit lands at the end of Layer 5 to keep a clean history per logical area.

**PAUSE for approval.**

---

# Layer 4 — Controllers

## Task 39: Refactor `user.controller.js` `login` method

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/controllers/user.controller.js`

- [ ] **Step 1: Read current login method**

```bash
grep -nA 20 "static async login" /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/user.controller.js
```

- [ ] **Step 2: Replace the login method (only that method) with**

```js
  static async login (req, res, next) {
    try {
      const { result, successful, errors } = await LoginService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
```

If the existing controller already uses this `sendResponse` shape, only the import needs verification (LoginService imported from `../../services/user/login.service`, sendResponse from `../../helpers/response.helpers`).

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/user.controller.js
```

- [ ] **Step 4: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/rest-resources/controllers/user.controller.js
git commit -m "refactor(user.controller): wire login to refactored service"
```

**PAUSE for approval.**

---

## Task 40: Add `recordManagement.controller.js`

**Files:**
- Create: `fsg_client_backend/src/rest-resources/controllers/recordManagement.controller.js`

- [ ] **Step 1: Write the file**

```js
import GetMyPatientsService     from '../../services/recordManagement/getMyPatients.service'
import GetPatientReportService  from '../../services/recordManagement/getPatientReport.service'
import DownloadReportService    from '../../services/recordManagement/downloadReport.service'
import { sendResponse } from '../../helpers/response.helpers'

export default class RecordManagementController {
  static async getMyPatients (req, res, next) {
    try {
      const { result, successful, errors } = await GetMyPatientsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getPatientReport (req, res, next) {
    try {
      const { result, successful, errors } = await GetPatientReportService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async downloadReport (req, res, next) {
    try {
      const { result, successful, errors } = await DownloadReportService.execute(req.query, req.context)

      if (!successful) {
        // Surface service errors through sendResponse for consistent shape
        return sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
      }

      // result = { filePath, fileName }
      return res.download(result.filePath, result.fileName, (err) => {
        if (err) next(err)
      })
    } catch (error) {
      next(error)
    }
  }
}
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/recordManagement.controller.js
```

- [ ] **Step 3: Commit**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/rest-resources/controllers/recordManagement.controller.js
git commit -m "feat(controllers): add recordManagement controller

Three thin handlers: getMyPatients, getPatientReport, downloadReport.
Download streams the file via res.download once authz/scoping has
passed in the service."
```

**PAUSE for approval.**

---

## Task 41: Add `patient.controller.js`

**Files:**
- Create: `fsg_client_backend/src/rest-resources/controllers/patient.controller.js`

- [ ] **Step 1: Write the file**

```js
import GetMyReportStatusService from '../../services/patient/getMyReportStatus.service'
import { sendResponse } from '../../helpers/response.helpers'

export default class PatientController {
  static async getMyReportStatus (req, res, next) {
    try {
      const { result, successful, errors } = await GetMyReportStatusService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
```

- [ ] **Step 2: Verify + commit**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/patient.controller.js
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/rest-resources/controllers/patient.controller.js
git commit -m "feat(controllers): add patient controller (report-status only)"
```

**PAUSE for approval.**

---

## Task 42: Refactor `testCategory.controller.js`

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/controllers/testCategory.controller.js`

- [ ] **Step 1: Replace contents (or add `getTestCatalog` method)**

```js
import GetTestCatalogService from '../../services/testCategory/getTestCatalog.service'
import { sendResponse } from '../../helpers/response.helpers'

export default class TestCategoryController {
  static async getTestCatalog (req, res, next) {
    try {
      const { result, successful, errors } = await GetTestCatalogService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
```

> **Note:** if the existing controller has methods used by routes we're keeping, preserve them. Otherwise replace.

- [ ] **Step 2: Verify + commit**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/testCategory.controller.js
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add src/rest-resources/controllers/testCategory.controller.js
git commit -m "refactor(testCategory.controller): expose getTestCatalog"
```

**PAUSE for approval.**

---

## Task 43: Trim dead controllers

**Files (touch only those that import dropped repos/services):**
- Modify: `fsg_client_backend/src/rest-resources/controllers/corporate.controller.js`
- Modify: `fsg_client_backend/src/rest-resources/controllers/doctor.controller.js`
- Modify: `fsg_client_backend/src/rest-resources/controllers/dashboard.controller.js`
- Modify: `fsg_client_backend/src/rest-resources/controllers/fileDownload.controller.js`
- Modify: `fsg_client_backend/src/rest-resources/controllers/payment.controller.js`

- [ ] **Step 1: Find each file's broken imports**

```bash
for f in corporate doctor dashboard fileDownload payment; do
  echo "=== $f.controller.js ==="
  grep -nE "Corporate|Individual|individualRepository|corporateRepository|fileAuthorization|getCorporatePatients|getCorporateTestResults" \
    /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/$f.controller.js
done
```

- [ ] **Step 2: For each broken file, choose action**

- If the controller is **only** used by routes we're replacing → delete the file:
  ```bash
  rm src/rest-resources/controllers/corporate.controller.js
  ```
- If it has methods reachable from routes we're keeping → trim only the broken methods, keep the rest. Remove their import lines.
- `fileDownload.controller.js` is the **old** download path that pairs with `fileAuthorization.middleware.js`. If its only consumers are the soon-to-be-replaced routes, delete the file. Otherwise trim its `download` method that depends on `fileAuthorization`.

- [ ] **Step 3: Verify each modified file parses**

```bash
for f in corporate doctor dashboard fileDownload payment; do
  if [ -f /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/$f.controller.js ]; then
    node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/controllers/$f.controller.js
  fi
done
```

- [ ] **Step 4: Stage; final commit lands at the end of Layer 5**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add -A src/rest-resources/controllers
```

**PAUSE for approval.**

---

# Layer 5 — Routes + middleware

## Task 44: Drop `fileAuthorization.middleware.js`

**Files:**
- Delete: `fsg_client_backend/src/rest-resources/middlewares/fileAuthorization.middleware.js`

- [ ] **Step 1: Confirm no surviving importers**

```bash
grep -RnE "fileAuthorization" /home/kia/Desktop/work/fsg/fsg_client_backend/src
```

If hits remain (route files we haven't replaced yet), they'll be addressed in Tasks 45–51. Delete the file regardless — broken imports surface clearly during boot in Task 51.

- [ ] **Step 2: Delete + stage**

```bash
rm /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/middlewares/fileAuthorization.middleware.js
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git rm src/rest-resources/middlewares/fileAuthorization.middleware.js
```

**PAUSE for approval.**

---

## Task 45: Refactor `user.routes.js` login schema

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/user.routes.js`

- [ ] **Step 1: Locate the login schemas**

```bash
grep -nA 30 "postLoginSchemas" /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/user.routes.js
```

- [ ] **Step 2: Replace the body of `postLoginSchemas.bodySchema`**

```js
const postLoginSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      userNameOrPhone: { type: 'string' },
      password:        { type: 'string' },
      accountType:     { type: 'string', enum: ['corporate', 'patient', 'doctor'] }
    },
    required: ['userNameOrPhone', 'password', 'accountType']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message:     { type: 'string' },
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id:          { type: ['number', 'string'] },
            uuid:        { type: 'string' },
            firstName:   { type: ['string', 'null'] },
            lastName:    { type: ['string', 'null'] },
            email:       { type: ['string', 'null'] },
            phone:       { type: ['string', 'null'] },
            accountType: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                roleType:   { type: 'string' },
                permission: { type: 'object' }
              }
            }
          }
        }
      },
      required: ['message', 'accessToken']
    }
  }
}
```

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/user.routes.js
```

**PAUSE for approval.**

---

## Task 46: Replace `corporate.routes.js`

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/corporate.routes.js`

- [ ] **Step 1: Replace contents**

```js
import express from 'express'
import RecordManagementController from '../../../controllers/recordManagement.controller'
import TestCategoryController from '../../../controllers/testCategory.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const listSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset: { type: ['number', 'string'], minimum: 0 },
      search: { type: 'string' }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data:    { type: 'array' },
        count:   { type: 'number' }
      },
      required: ['message', 'data']
    }
  }
}

const patientReportSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      patientUuid: { type: 'string' },
      limit:       { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset:      { type: ['number', 'string'], minimum: 0 }
    },
    required: ['patientUuid']
  },
  responseSchema: listSchemas.responseSchema
}

const corporateRoutes = express.Router()

corporateRoutes.route('/patients').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(listSchemas),
  RecordManagementController.getMyPatients,
  responseValidationMiddleware(listSchemas)
)

corporateRoutes.route('/patient-report').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(patientReportSchemas),
  RecordManagementController.getPatientReport,
  responseValidationMiddleware(patientReportSchemas)
)

corporateRoutes.route('/test-catalog').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(listSchemas),
  TestCategoryController.getTestCatalog,
  responseValidationMiddleware(listSchemas)
)

export default corporateRoutes
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/corporate.routes.js
```

**PAUSE for approval.**

---

## Task 47: Replace `doctor.routes.js`

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/doctor.routes.js`

- [ ] **Step 1: Replace contents**

```js
import express from 'express'
import RecordManagementController from '../../../controllers/recordManagement.controller'
import TestCategoryController from '../../../controllers/testCategory.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const listSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset: { type: ['number', 'string'], minimum: 0 },
      search: { type: 'string' }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data:    { type: 'array' },
        count:   { type: 'number' }
      },
      required: ['message', 'data']
    }
  }
}

const patientReportSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      patientUuid: { type: 'string' },
      limit:       { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset:      { type: ['number', 'string'], minimum: 0 }
    },
    required: ['patientUuid']
  },
  responseSchema: listSchemas.responseSchema
}

const doctorRoutes = express.Router()

doctorRoutes.route('/patients').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(listSchemas),
  RecordManagementController.getMyPatients,
  responseValidationMiddleware(listSchemas)
)

doctorRoutes.route('/patient-report').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(patientReportSchemas),
  RecordManagementController.getPatientReport,
  responseValidationMiddleware(patientReportSchemas)
)

doctorRoutes.route('/test-catalog').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(listSchemas),
  TestCategoryController.getTestCatalog,
  responseValidationMiddleware(listSchemas)
)

export default doctorRoutes
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/doctor.routes.js
```

**PAUSE for approval.**

---

## Task 48: Add `patient.routes.js`

**Files:**
- Create: `fsg_client_backend/src/rest-resources/routes/api/v1/patient.routes.js`

- [ ] **Step 1: Write the file**

```js
import express from 'express'
import PatientController from '../../../controllers/patient.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const reportStatusSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit:  { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset: { type: ['number', 'string'], minimum: 0 }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data:    { type: 'array' },
        count:   { type: 'number' }
      },
      required: ['message', 'data']
    }
  }
}

const patientRoutes = express.Router()

patientRoutes.route('/report-status').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(reportStatusSchemas),
  PatientController.getMyReportStatus,
  responseValidationMiddleware(reportStatusSchemas)
)

export default patientRoutes
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/patient.routes.js
```

**PAUSE for approval.**

---

## Task 49: Add `reports.routes.js`

**Files:**
- Create: `fsg_client_backend/src/rest-resources/routes/api/v1/reports.routes.js`

- [ ] **Step 1: Write the file**

```js
import express from 'express'
import RecordManagementController from '../../../controllers/recordManagement.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'

const downloadSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      docInstanceUuid: { type: 'string' }
    },
    required: ['docInstanceUuid']
  }
}

const reportsRoutes = express.Router()

reportsRoutes.route('/download').get(
  contextMiddleware(true),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(downloadSchemas),
  RecordManagementController.downloadReport
)

export default reportsRoutes
```

- [ ] **Step 2: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/reports.routes.js
```

**PAUSE for approval.**

---

## Task 50: Update `routes/api/v1/index.js`

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/index.js`

- [ ] **Step 1: Read existing**

```bash
cat /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/index.js
```

- [ ] **Step 2: Add new route registrations and remove dead ones**

Edit the file. Add at the import section:

```js
import patientRoutes  from './patient.routes'
import reportsRoutes  from './reports.routes'
```

Add at the router-mount section:

```js
router.use('/patient',  patientRoutes)
router.use('/reports',  reportsRoutes)
```

Remove any line that imports or mounts deleted route handlers (none of corporate/doctor/user routes were deleted — those still mount).

- [ ] **Step 3: Verify**

```bash
node --check /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/index.js
```

**PAUSE for approval.**

---

## Task 51: Trim dead route handlers in `dashboard/payment/transactions` routes; final boot smoke; commit Layers 4–5

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/dashboard.routes.js`
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/payment.routes.js`
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/transactions.routes.js`

- [ ] **Step 1: Find broken imports/handlers**

```bash
for f in dashboard payment transactions; do
  echo "=== $f.routes.js ==="
  grep -nE "Corporate|Individual|individualRepository|corporateRepository|fileAuthorization|getAllTestResult|getCorporate" \
    /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/$f.routes.js
done
```

- [ ] **Step 2: Trim**

For each route file, comment out or delete the route registrations whose handlers/middleware no longer exist. **Don't refactor the handlers** — just remove the registration so the file parses and the app boots. The handler logic redesign happens in a follow-up.

- [ ] **Step 3: Verify all route files parse**

```bash
for f in /home/kia/Desktop/work/fsg/fsg_client_backend/src/rest-resources/routes/api/v1/*.js; do
  node --check "$f" || echo "FAILED: $f"
done
```

- [ ] **Step 4: Boot smoke**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
NODE_ENV=development npm run start 2>&1 | head -80
```

Expect: server starts cleanly (output like "Server running on …"). Any remaining `MODULE_NOT_FOUND` points to a missed cleanup.

- [ ] **Step 5: Final commit for Layers 4 + 5**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git add -A src/rest-resources src/services
git commit -m "feat(routes+controllers+services): wire new external API surface

- /user/login: refactored DTO and service (3-value accountType).
- /corporate/{patients,patient-report,test-catalog} (CORPORATE permission).
- /doctor/{patients,patient-report,test-catalog} (DOCTOR permission).
- /patient/report-status (PATIENT permission).
- /reports/download?docInstanceUuid=... (REPORTS permission, all
  three account types via permission shape).
- All authenticated routes use checkPermission middleware.
- fileAuthorization middleware deleted; old corporate/individual
  services removed; legacy controllers trimmed.

App boots; ready for end-to-end smoke."
```

**PAUSE for approval.**

---

# Layer 6 — End-to-end smoke

## Task 52: Curl-driven smoke checklist

**Files:** none modified.

- [ ] **Step 1: DB-state verification (against shared local Postgres)**

```sql
\d test_results       -- hospital_id NOT NULL, doctor_id NOT NULL
\d form_requests      -- doctor_id NOT NULL
\d users              -- column is account_type
\d test_categories    -- 5 new columns

SELECT name, role_type FROM user_roles ORDER BY id;
-- expect: FSG:PATIENT/PATIENT, FSG:CORPORATE/CORPORATE,
--         FSG:DOCTOR/DOCTOR, FSG:PAYMENT/PAYMENT

SELECT permission FROM user_roles WHERE role_type='PATIENT';
-- expect: { "PATIENT":["R"], "REPORTS":["R"] }

SELECT count(*) FROM test_results WHERE hospital_id IS NULL;  -- 0
SELECT count(*) FROM test_results WHERE doctor_id   IS NULL;  -- 0
SELECT count(*) FROM form_requests WHERE doctor_id  IS NULL;  -- 0

SELECT DISTINCT account_type FROM users;
-- expect: corporate | patient | doctor   (none other)
```

- [ ] **Step 2: Login (corporate)**

```bash
HOST=http://localhost:8005   # adjust to external app's port
curl -sS -X POST "$HOST/admin/api/v1/user/login" \
  -H 'Content-Type: application/json' \
  -d '{"userNameOrPhone":"<corp-user>","password":"<pw>","accountType":"corporate"}'
```

Expect: `{ "data": { "message":"Authentication successful", "accessToken":"...", "user":{...} }, "errors":[] }`.

- [ ] **Step 3: Login error cases**

Repeat with bad password (expect `InvalidCredentials`), unknown user (expect `UserNotExists`), unverified phone but correct password (expect 200 — OTP gate gone).

- [ ] **Step 4: getMyPatients (corporate)**

```bash
TOKEN=<from step 2>
curl -sS "$HOST/admin/api/v1/corporate/patients?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Expect array of `{ patientId, name, dob, mobile, email }`.

Repeat for `doctor` user against `/doctor/patients` after a separate login.

- [ ] **Step 5: getPatientReport**

Pick a `patientUuid` from Step 4. Then:

```bash
curl -sS "$HOST/admin/api/v1/corporate/patient-report?patientUuid=$UUID" \
  -H "Authorization: Bearer $TOKEN"
```

Expect array of `{ patientId, patientName, createdAt, testDone, reportDate, docInstanceUuid }` containing only completed/released tests.

- [ ] **Step 6: getTestCatalog**

```bash
curl -sS "$HOST/admin/api/v1/corporate/test-catalog?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Expect array of `{ testName, testCode, turnAroundTime }`.

- [ ] **Step 7: download (own)**

Pick a `docInstanceUuid` from Step 5. Then:

```bash
curl -sSf "$HOST/admin/api/v1/reports/download?docInstanceUuid=$DOC" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/report.pdf

file /tmp/report.pdf   # expect: PDF document
```

- [ ] **Step 8: download (cross-tenant denial — enumeration-resistant)**

Get a docInstanceUuid that belongs to a different hospital. Repeat Step 7. Expect 404 with `DocInstanceNotFound` error code (NOT 403 — same code as not-exists / not-released).

- [ ] **Step 9: download (not released)**

Pick a docInstance whose `status != 'RELEASED'`. Repeat Step 7. Expect 404 `DocInstanceNotFound` — identical body to Step 8 (no enumeration leak).

- [ ] **Step 10: patient flow**

Login as a patient: `accountType:'patient'`. Then:

```bash
curl -sS "$HOST/admin/api/v1/patient/report-status" \
  -H "Authorization: Bearer $TOKEN"
```

Expect array of `{ testName, receivedDate, testStatus, turnAroundTime, docInstanceUuid }` for that patient — across all statuses, not just released.

Then: `GET /reports/download?docInstanceUuid=<owned>` succeeds; with someone else's UUID returns 404.

- [ ] **Step 11: permission denials**

Patient tries `/corporate/patients` → expect 403 `PermissionDenied`.

Doctor tries `/patient/report-status` → expect 403 `PermissionDenied`.

Payment-role user tries `/reports/download` (with own scope) → expect 200.

Payment-role user tries `/corporate/patients` → expect 403 (no `CORPORATE` permission module).

- [ ] **Step 12: tag the smoke as done (or note any failures)**

If everything passes:

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git tag external-realignment-v1
```

If something fails, capture the curl output + log line and bring it back. Don't loop — escalate.

**PAUSE for review of all results.**

---

## Self-Review

### Spec coverage

Walked the spec section by section:

- §Summary / §Motivation — design context, no implementation.
- §Scope (in scope) — every bullet maps to a task:
  - Drop external models → Task 7
  - Add/align external models → Tasks 9–17
  - Internal schema flips → Tasks 1, 2
  - Internal new columns → Task 3
  - Internal column rename → Task 4
  - Internal seed updates → Tasks 5, 6
  - External `permissions.js` → Task 28
  - External login refactor → Tasks 31, 32, 45
  - `/reports/download` endpoint → Tasks 24, 33, 40, 49
  - Read endpoints → Tasks 21, 22, 23, 25, 34–37, 40, 41, 42, 46, 47, 48, 50
  - Manual smoke tests → Task 52
- §Topology — implementation-agnostic context, no task.
- §Vocabulary — encoded in concrete edits across Tasks 4, 5, 6, 16, 17, 28.
- §Layered execution order — preserved: Layer 1A → 1B → 1C → 1D → 2 → 3 → 4 → 5 → 6.
- §DB schema changes — Tasks 1–6.
- §Authentication flow — Tasks 31, 32.
- §Permission middleware integration — Tasks 28, 46–50 (chain wiring).
- §Download flow — Tasks 24, 33, 40, 49.
- §Read APIs — Tasks 21, 22, 23, 25, 34–37, 40, 41, 42, 46–48.
- §`resolveOwnerScope` helper — Task 29.
- §`ValidateUserAccountLinkService` — Task 31.
- §Error handling — Task 30.
- §Logging — required pattern is enforced by every service in Tasks 31–37.
- §Files Modified — every file appears in the File Structure overview at the top of the plan.
- §Files NOT modified — out-of-scope items (M2M backfill, JSON data load, dashboard redesign, payment role) explicitly NOT in plan.
- §Testing — Task 52.
- §Open questions — none blocking; the two product callouts (payment download, internal admin role naming) live as plan-level non-goals.

No gaps.

### Placeholder scan

Searched for "TBD", "TODO", "implement later", "fill in", "appropriate", "as needed". Two soft notes in the plan:
- Task 4 Step 3: "Most likely zero hits since this column was added but not yet read by internal code; confirm." — this is a prediction the engineer verifies via the literal grep command. Acceptable.
- Task 38 Step 1: "If yes → delete in this task. If no → leave it alone (deferred per Q9d)." — a triage instruction with concrete inputs (the grep result) and concrete actions for each branch. Acceptable.

No bare TODOs.

### Type / signature consistency

Checked names across tasks:
- Repo method `findByUserNameOrPhoneWithRoleIn(userNameOrPhone, roleTypes, options)` — defined in Task 20, declared in Task 26, called in Task 32. ✓
- Repo method `findReleasedByUuidScoped(uuid, ownerColumn, ownerValue, options)` — defined in Task 24, declared in Task 26, called in Task 33. ✓
- Repo method `findDistinctPatientsByOwner(ownerColumn, ownerValue, options)` — defined in Task 21, declared in Task 26, called in Task 34. ✓
- Repo method `findCompletedReleasedForPatientScoped(patientUuid, ownerColumn, ownerValue, options)` — defined in Task 21, declared in Task 26, called in Task 35. ✓
- Repo method `findAllForPatient(patientId, options)` — defined in Task 21, declared in Task 26, called in Task 37. ✓
- `resolveOwnerScope(user)` returns `{ column, value }` — defined in Task 29, used in Tasks 31, 33, 34, 35. ✓
- `accountType` value enum (`corporate | patient | doctor`) — consistent in Tasks 16, 28, 29, 31, 32, 45.
- `roleType` enum (`CORPORATE | PATIENT | DOCTOR | PAYMENT`) — consistent in Tasks 5, 28, 32.
- Error type names (`AccountNotLinkedErrorType`, `AccountLinkBrokenErrorType`, `DocInstanceNotFoundErrorType`, `PdfNotGeneratedErrorType`) — defined in Task 30, used in Tasks 31, 33, 34, 35, 37.

All consistent.

---

## Plan complete.

Saved to `docs/superpowers/plans/2026-04-27-external-realignment.md`.

**Execution mode (locked per user constraint): inline via `superpowers:executing-plans`. No subagents. User approves at each task boundary.**
