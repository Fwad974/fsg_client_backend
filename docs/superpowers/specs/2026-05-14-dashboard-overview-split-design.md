# Dashboard `/overview` Split — Design Spec

**Date:** 2026-05-14
**Repo:** `fsg_client_backend`
**Status:** Approved — pending implementation plan
**Supersedes (in part):** `2026-05-12-corporate-dashboard-design.md` — the `/dashboard/overview` endpoint defined there is replaced; the rest of that spec (Sample/SampleDelivery models, repositories, `getTestCategoryDistribution`, date-window util, percentage util, permission scaffolding) remains in force.

---

## Goal

Split the existing `GET /api/v1/dashboard/overview` endpoint into two endpoints so the corporate dashboard UI can request each block independently and the backend services have a single responsibility each.

- `GET /api/v1/dashboard/doc-status-overview` — returns the document status overview block (was `response.data.docStatusOverview`).
- `GET /api/v1/dashboard/kpi-overview` — returns the KPI block (was `response.data.statusOverview`, renamed conceptually to "KPI").

A reusable helper service `ValidateUserHospitalService` is introduced under `services/user/helper/` to replace inline `UserRepository.findByIdAndType(..., CORPORATE, { attributes: ['hospitalId'] })` lookups across the five corporate callsites currently in the codebase.

## Non-goals

- Doctor and patient hospital/role-link refactors. The helper is **corporate-only** in this round; a parallel `validateUserDoctor` / `validateUserPatient` (or a generalized variant) is explicitly deferred per user direction.
- Changes to `/api/v1/dashboard/test-category-distribution` — that endpoint remains untouched aside from swapping its inline hospital lookup for the new helper.
- Changes to the SQL repositories, date-window util, percentage util, Sample/SampleDelivery models, or constants added by the previous dashboard spec. All of that stands.

---

## Architecture

### Endpoint surface (final state)

| Method | Path | Permission alias | Service | Returns (`data`) |
|---|---|---|---|---|
| GET | `/api/v1/dashboard/doc-status-overview` | `CORPORATE` | `GetDocStatusOverviewService` | `{ total, segments[] }` |
| GET | `/api/v1/dashboard/kpi-overview` | `CORPORATE` | `GetKpiOverviewService` | `{ testCount, processingRate, pendingAction, rejectedRate{}, testConducted }` |
| GET | `/api/v1/dashboard/test-category-distribution` | `CORPORATE` | `GetTestCategoryDistributionService` | unchanged |

Removed: `GET /api/v1/dashboard/overview` and its alias `dashboard/overview`.

### Bootstrap performed independently by each new service

Each of the two split services performs the same bootstrap in its `run()`:

1. `resolveWindow({ from, to })` → defaults to current calendar month UTC.
2. Guard: if `from > to`, `addError('InvalidDateRangeErrorType')` and return.
3. `await ValidateUserHospitalService.run({}, this.context)` to retrieve the user's `hospitalId` (the helper throws `AccountNotLinkedErrorType` on failure, which propagates to the controller's `next(error)`).
4. Run the service's actual data work using `hospitalId`, `from`, `to`.

`resolveWindow` is invoked twice across the two endpoints. The user has explicitly accepted this duplication as preferable to introducing another layer of abstraction.

### New helper service

**Path:** `services/user/helper/validateUserHospital.service.js`

**Responsibility:** Confirm the authenticated caller is a corporate user linked to a hospital. Return the user row (subset of attributes); add `AccountNotLinkedErrorType` otherwise.

**Contract:**

- Reads `userId` from `this.context.auth.id` — caller normally passes `{}` for args.
- Accepts optional `args.attributes: string[]` to widen returned columns.
- Default attributes: `['id', 'accountType', 'hospitalId']` (DB column names from the `User` model).
- Looks up via `UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes })`.
- If user not found OR `hospitalId` is falsy → `this.addError('AccountNotLinkedErrorType')` and return.
- Otherwise returns the raw user object (only the requested attributes).

**Caller pattern (canonical for the codebase — matches `services/user/login.service.js:48`):**

```js
const user = await ValidateUserHospitalService.run({}, this.context)
const { hospitalId } = user
```

`Service.run()` throws on `addError`, so callers do not need to merge errors. `Service.execute()` is reserved for controllers and fire-and-forget event services. See `feedback_service_run_vs_execute.md`.

### Refactored callsites (corporate hospital lookup)

The 5 corporate callsites currently doing inline `UserRepository.findByIdAndType(userId, CORPORATE, { attributes: ['hospitalId'] })` switch to `ValidateUserHospitalService.run({}, this.context)`:

| File | Line (current) |
|---|---|
| `services/corporate/getCorporatePatients.service.js` | 29 |
| `services/corporate/getCorporatePatientsReport.service.js` | 41 |
| `services/dashboard/getTestCategoryDistribution.service.js` | 29 |
| `services/dashboard/getDocStatusOverview.service.js` (new — promoted from `helper/`) | n/a |
| `services/dashboard/getKpiOverview.service.js` (new — renamed from `getStatusOverview`) | n/a |

Out of scope (explicit deferral):

- `services/doctor/getDoctorPatients.service.js:29`
- `services/doctor/getDoctorPatientsReport.service.js:41`
- `services/patient/getMyReportStatus.service.js:28`
- `services/reportManagement/downloadReport.service.js:29` (multi-role)

### Logging discipline (project-wide rule — see `claude.md → Logging Pattern → When to Log`)

Every call boundary inside a service or controller that returns a value must be followed by a single-line `logger.info(...)` capturing what came back. This applies to:

- Repository / query calls — log the result from the calling service (not from inside the repo; repos stay query-only).
- Service-to-service calls (`Service.run` / `Service.execute`) — log the returned value.
- Helper / private-method / utility calls — log the return.

Every log line: short purposeful `message` string + `context: { ... }` object with relevant fields. One logical log per event.

This rule applies to every file added or modified by this spec.

---

## Service internals

### `services/user/helper/validateUserHospital.service.js`

```js
import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import UserRepository from '../../../infrastructure/repositories/userRepository'
import { ACCOUNT_TYPE } from '../../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    attributes: { type: 'array', items: { type: 'string' } }
  },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class ValidateUserHospitalService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { attributes = ['id', 'accountType', 'hospitalId'] } = this.args

    logger.info('ValidateUserHospitalService: ', { message: 'Looking up corporate user link', context: { userId: JSON.stringify(userId), attributes: JSON.stringify(attributes) } })

    const user = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes })

    logger.info('ValidateUserHospitalService: ', { message: 'User row fetched', context: { found: JSON.stringify(!!user), hospitalIdPresent: JSON.stringify(!!user?.hospitalId) } })

    if (!user?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    return user
  }
}
```

### `services/dashboard/getDocStatusOverview.service.js` (promoted out of `helper/`)

Constraints: same as current `/overview` — optional `from` + `to`, both required together, no extras.

`run()` outline:

1. Pull `logger` from context, resolve `{ from, to }` via `resolveWindow`.
2. Guard `from > to` with `InvalidDateRangeErrorType`.
3. Log: window resolved.
4. `await ValidateUserHospitalService.run({}, this.context)` → log the returned `{ id, hospitalId }`.
5. `Promise.all([ DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }), TestResultRepository.countCompletedRecordMgmtMissingDocInstance(hospitalId, { from, to }) ])` → emit one summary `logger.info` line containing both returned values in its `context`.
6. Compute `received / pendingReview / pendingApproval / released / total / segments[]` using `percentage` util.
7. Return `{ message: 'OK', total, segments }`.

### `services/dashboard/getKpiOverview.service.js` (renamed from `helper/getStatusOverview.service.js`)

Constraints: same as `getDocStatusOverview` (optional `from` + `to`).

`run()` outline:

1. Pull `logger`, resolve window, guard date range — log resolved window.
2. `await ValidateUserHospitalService.run({}, this.context)` — log returned user.
3. `Promise.all([ TestResultRepository.countByHospital, DocInstanceRepository.countByStatusForHospitalRecordMgmt, SampleRepository.countByHospital, SampleRepository.countRejectedByHospital ])` — emit one summary `logger.info` line containing all four returned values in its `context`.
4. Compute: `testCount`, `processingRate = percentage(released, testCount)`, `pendingAction = pendingReview + pendingApproval`, `rejectedRate { totalSamples, rejectedSamples, rejectedRate: percentage(rejectedSamples, totalSamples) }`, `testConducted = released`.
5. Return `{ message: 'OK', testCount, processingRate, pendingAction, rejectedRate, testConducted }`.

### Existing callsite refactor pattern

For each of the 3 non-dashboard corporate services (`getCorporatePatients`, `getCorporatePatientsReport`, `getTestCategoryDistribution`):

- Remove the import of `UserRepository` if no longer used.
- Import `ValidateUserHospitalService` from `../user/helper/validateUserHospital.service`.
- Replace the 2-line inline lookup + guard with:
  ```js
  const user = await ValidateUserHospitalService.run({}, this.context)
  logger.info('<ServiceName>: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })
  const { hospitalId } = user
  ```

---

## REST surface

### Routes — `rest-resources/routes/api/v1/dashboard.routes.js`

- Drop the `/overview` route and its `overviewSchemas` block.
- Add two routes, each with `contextMiddleware → authenticationMiddleware → checkPermission → requestValidationMiddleware → DashboardController.method → responseValidationMiddleware`.
- Query schema for both: `{ from?: date, to?: date }` with `dependencies: { from: ['to'], to: ['from'] }` and `additionalProperties: false`.
- Response schemas inline:
  - `/doc-status-overview` `data`: `{ total: number, segments: Array<{status, count, percentage}> }`
  - `/kpi-overview` `data`: `{ testCount, processingRate, pendingAction, rejectedRate: { totalSamples, rejectedSamples, rejectedRate }, testConducted }` — all `number`.

### Controller — `rest-resources/controllers/dashboard.controller.js`

Replace the `getOverview` static method with two static methods:

```js
static async getDocStatusOverview (req, res, next) {
  try {
    const { result, successful, errors } = await GetDocStatusOverviewService.execute(req.query, req.context, GetDocStatusOverviewPresenter)
    sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
  } catch (error) { next(error) }
}

static async getKpiOverview (req, res, next) {
  try {
    const { result, successful, errors } = await GetKpiOverviewService.execute(req.query, req.context, GetKpiOverviewPresenter)
    sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
  } catch (error) { next(error) }
}
```

(`getTestCategoryDistribution` static method unchanged.)

### Presenters — `presenters/dashboard/`

- New `getDocStatusOverview.presenter.js` → `{ message, data: { total, segments } }`
- New `getKpiOverview.presenter.js` → `{ message, data: { testCount, processingRate, pendingAction, rejectedRate, testConducted } }`
- Delete `getOverview.presenter.js`.

### Permissions — `libs/permissions.js`

```diff
- 'dashboard/overview':                   'CORPORATE',
+ 'dashboard/doc-status-overview':        'CORPORATE',
+ 'dashboard/kpi-overview':               'CORPORATE',
  'dashboard/test-category-distribution': 'CORPORATE'
```

---

## File-level change summary

**New:**
- `src/services/user/helper/validateUserHospital.service.js`
- `src/services/dashboard/getDocStatusOverview.service.js` (promoted; was `helper/getDocStatusOverview.service.js`)
- `src/services/dashboard/getKpiOverview.service.js` (renamed; was `helper/getStatusOverview.service.js`)
- `src/presenters/dashboard/getDocStatusOverview.presenter.js`
- `src/presenters/dashboard/getKpiOverview.presenter.js`

**Modified:**
- `src/services/corporate/getCorporatePatients.service.js` — use helper
- `src/services/corporate/getCorporatePatientsReport.service.js` — use helper
- `src/services/dashboard/getTestCategoryDistribution.service.js` — use helper
- `src/rest-resources/controllers/dashboard.controller.js` — replace `getOverview` with two methods
- `src/rest-resources/routes/api/v1/dashboard.routes.js` — replace `/overview` with two routes
- `src/libs/permissions.js` — swap alias

**Deleted:**
- `src/services/dashboard/getOverview.service.js`
- `src/services/dashboard/helper/getDocStatusOverview.service.js` (replaced by promoted version)
- `src/services/dashboard/helper/getStatusOverview.service.js` (replaced by renamed version)
- `src/services/dashboard/helper/` (folder, if now empty)
- `src/presenters/dashboard/getOverview.presenter.js`

---

## Testing / verification

Manual smoke matrix against the corporate test account:

### `/dashboard/doc-status-overview`
- No query params → 200, flat `data: { total, segments[] }` for current calendar month.
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` (valid window) → 200.
- `from > to` → 400 `INVALID_DATE_RANGE`.
- Logged-in non-corporate user → permission denied.
- Corporate user with `hospitalId = null` → 400 `ACCOUNT_NOT_LINKED`.

### `/dashboard/kpi-overview`
- Same matrix as above; verify each numeric field present and types match the response schema.

### Regression
- `GET /api/v1/dashboard/test-category-distribution` still returns the existing shape (helper swap is the only change).
- `GET /api/v1/corporate/patients` and `/corporate/patients-report` still work after helper swap.
- `GET /api/v1/dashboard/overview` → 404 (route removed).
- Log output for a single successful request to `/doc-status-overview` shows: window resolved → hospital link confirmed → both repo results → presenter output. Each on its own single line.

---

## Open follow-ups (out of scope for this spec)

- Generalize `validateUserHospital` to handle doctor and patient roles (or introduce parallel `validateUserDoctor` / `validateUserPatient`) once the corporate split is in place and the pattern is proven.
- Apply the same "log every call boundary" sweep to the rest of the codebase incrementally as files are touched.
