# Dashboard — Pending Actions Design Spec

**Date:** 2026-05-14
**Scope:** `fsg_internal_backend` + `fsg_client_backend`
**Status:** Approved — pending implementation plan
**Related specs:** `2026-05-12-corporate-dashboard-design.md`, `2026-05-14-dashboard-overview-split-design.md`

---

## Goal

Surface a "Pending Actions" list on the corporate dashboard that shows tests with open alerts — currently two kinds: **rejected** tests and **critical** doc-instance results. Corporate users can acknowledge alerts in bulk; acknowledged alerts disappear from the list. The schema keeps a full history of every alert event per test (no overwrites) so the same test may surface multiple alerts over its lifetime.

A new column `download_acknowledged_at` is reserved on the alert table for a future "download a critical-flagged PDF" gate; **no endpoint sets it in this sub-project**.

## Non-goals

- PDF download gating (the `download_acknowledged_at` column exists in the schema but no API surface uses it here).
- Doctor or patient dashboard. CORPORATE-only.
- Re-release / amend flows for doc instances — out of scope per user input ("release can happen once and it can not be amended"). Critical-alert insertion fires at most once per doc-instance release.
- Notifications, emails, or webhooks. Pending Actions is a polled-by-frontend list.

## Architecture

A new `test_alerts` table records one row per alert event. Internal writes the rows in two places; external reads + acks them.

| Write path (internal) | Trigger | Inserts |
|---|---|---|
| `CreateRejectedAlertsForTestsService` | called inside `SubmitFormRequestService.run()`, after `CreateTestsBulkService.run(...)` returns | one row per test where `status='rejected'`, `alertType='rejected'` |
| `CreateCriticalAlertIfHighRiskService` | called inside `recordManagement/releaseDocument.service.js`, after the doc instance flips to `RELEASED` | zero or one row depending on whether any value in `manualFieldValues.trisomyScreeningResults` or `manualFieldValues.otherChromosomeScreeningResults` equals `'HIGH RISK'`; if inserted, `alertType='critical'` |

| Read/ack path (external) | Method | Path |
|---|---|---|
| `GetPendingActionsService` | GET | `/api/v1/dashboard/pending-actions` |
| `AcknowledgeAlertsService` | POST | `/api/v1/dashboard/pending-actions/acknowledge` |

Both external endpoints are CORPORATE-only. The POST adds the `'C'` permission to `PERMISSIONS.CORPORATE` (currently `['R']` only).

---

## Database

### Migration

`fsg_internal_backend/src/db/migrations/<timestamp>-create-test-alerts.js`

Per repo rule, every migration lives in internal regardless of which backend reads the table (`feedback_migrations_in_internal.md`).

Table `test_alerts`:

| Column (snake_case) | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT, PK, autoIncrement | NOT NULL | — | |
| `uuid` | STRING | NOT NULL | UUIDV4 | UNIQUE constraint — opaque external handle |
| `test_result_id` | BIGINT | NOT NULL | — | application-level FK to `test_results.id`; no DB CASCADE |
| `alert_type` | STRING | NOT NULL | — | app-level enum: `'rejected'` \| `'critical'` |
| `acknowledged_at` | TIMESTAMP | NULL | — | set when user acks from the Pending Actions list |
| `acknowledged_by_user_id` | BIGINT | NULL | — | application-level FK to `users.id` (external user table) — the corporate user who acked |
| `download_acknowledged_at` | TIMESTAMP | NULL | — | reserved for the future PDF-download gating flow; not written by any endpoint in this spec |
| `created_at` | TIMESTAMP | NOT NULL | — | row creation = alert raised date |
| `updated_at` | TIMESTAMP | NOT NULL | — | |

**Indexes**

- Non-unique composite index on `(test_result_id, alert_type, acknowledged_at)` to make the dashboard GET fast: filters by `acknowledged_at IS NULL`, joins via `test_result_id`, and groups by test.

**Unique constraints**

- Only on `uuid` (per `feedback_unique_indexes_allowed.md`).

**Rows are immutable history**

`acknowledged_at` and `download_acknowledged_at` are each set at most once. The application enforces this — already-acknowledged rows are silently skipped by the POST endpoint. No DB-level CHECK constraint required.

### Models

`fsg_internal_backend/src/db/models/testAlert.model.js` — full schema. `belongsTo` TestResult. `paranoid: false` (history table, no soft-delete).

`fsg_client_backend/src/db/models/testAlert.model.js` — same schema since external reads all columns and writes `acknowledged_at`, `acknowledged_by_user_id`. `belongsTo` TestResult.

### App constants

Add to both backends' `src/libs/constants.js`:

```js
export const ALERT_TYPE = {
  REJECTED: 'rejected',
  CRITICAL: 'critical'
}
```

---

## Internal: rejected-alert write path

### `services/testAlert/createRejectedAlertsForTests.service.js`

Args: `{ createdTests: Array<{ id, status }> }` (the array returned by `CreateTestsBulkService`).

`run()` outline:

1. Pull `logger`, `sequelizeTransaction` from context.
2. `rejectedTests = createdTests.filter(t => t.status === TEST_RESULT_STATUS.REJECTED)`.
3. Log filtered list.
4. If empty → return `{ createdCount: 0 }`.
5. Build rows `[{ testResultId, alertType: ALERT_TYPE.REJECTED }, ...]`.
6. `await TestAlertRepository.bulkCreate(rows, sequelizeTransaction)` → log returned inserted rows.
7. Return `{ createdCount: inserted.length }`.

### Plug-in point

`services/formRequest/submitFormRequest.service.js`, right after `createdTests = await CreateTestsBulkService.run({ preparedTests }, this.context)`:

```js
createdTests = await CreateTestsBulkService.run({ preparedTests }, this.context)
logger.info('SubmitFormRequestService: ', { message: 'Tests created', context: { createdCount: createdTests.length } })

const rejectedAlertsResult = await CreateRejectedAlertsForTestsService.run({ createdTests }, this.context)
logger.info('SubmitFormRequestService: ', { message: 'Rejected alerts created', context: { rejectedAlertsResult: JSON.stringify(rejectedAlertsResult) } })
```

Runs inside the same `sequelizeTransaction` — if alert creation fails, the whole submit rolls back. No orphan rejected tests without alerts.

### Repository (internal)

`infrastructure/repositories/testAlertRepository.js`:

- `bulkCreate(rows, transaction)` — `TestAlert.bulkCreate(rows, { transaction })`
- `create(row, transaction)` — `TestAlert.create(row, { transaction })`

---

## Internal: critical-alert write path

### Helper utility — HIGH RISK detector

`utils/criticalRiskDetector.utils.js`:

```js
const HIGH_RISK = 'HIGH RISK'
const CRITICAL_GROUPS = ['trisomyScreeningResults', 'otherChromosomeScreeningResults']

export const hasHighRiskResult = (manualFieldValues) => {
  if (!manualFieldValues) return false
  return CRITICAL_GROUPS.some(group => {
    const groupValues = manualFieldValues[group]
    if (!groupValues || typeof groupValues !== 'object') return false
    return Object.values(groupValues).some(v => v === HIGH_RISK)
  })
}
```

Pure function — testable without the service stack.

### `services/testAlert/createCriticalAlertIfHighRisk.service.js`

Args: `{ docInstance: { testResultId, manualFieldValues } }`.

`run()` outline:

1. Pull `logger`, `sequelizeTransaction` from context.
2. `isCritical = hasHighRiskResult(docInstance.manualFieldValues)`.
3. Log evaluation result.
4. If `!isCritical` → return `{ created: false }`.
5. `await TestAlertRepository.create({ testResultId: docInstance.testResultId, alertType: ALERT_TYPE.CRITICAL }, sequelizeTransaction)` → log returned alert.
6. Return `{ created: true, alert }`.

### Plug-in point

`services/recordManagement/releaseDocument.service.js`:

- Extend the `ValidateDocInstanceByUuidService` attributes request to also load `manualFieldValues` and `testResultId`.
- Call `CreateCriticalAlertIfHighRiskService.run({ docInstance }, this.context)` immediately after `DocInstanceRepository.update(... { status: RELEASED, ... })` returns and is logged.

```js
const docInstance = await ValidateDocInstanceByUuidService.run(
  { docInstanceUuid, attributes: ['id', 'uuid', 'status', 'autoFieldValues', 'manualFieldValues', 'testResultId'] },
  this.context
)
// ... existing release update ...
await DocInstanceRepository.update(docInstance.id, { status: DOC_INSTANCE_STATUS.RELEASED, approvedBy: adminId, releasedDate: new Date(), autoFieldValues }, sequelizeTransaction)
logger.info('ReleaseDocumentService: ', { message: 'Doc instance flipped to released', context: { docInstanceId: JSON.stringify(docInstance.id) } })

const criticalAlertResult = await CreateCriticalAlertIfHighRiskService.run({ docInstance }, this.context)
logger.info('ReleaseDocumentService: ', { message: 'Critical alert check ran', context: { criticalAlertResult: JSON.stringify(criticalAlertResult) } })

await pdfGenerationQueue.add(JOB_GENERATE_PREVIEW_PDF, { docInstanceId: docInstance.id })
```

Same transaction as the release — if alert insertion fails, the release rolls back.

---

## External: `GET /dashboard/pending-actions`

### Service

`fsg_client_backend/src/services/dashboard/getPendingActions.service.js`

Args (query): `{ limit?: number (1-100, default 20), offset?: number (>=0, default 0) }`.

`run()` outline:

1. Pull `logger` from context, read `limit`, `offset` from `this.args` (with defaults).
2. `await ValidateUserHospitalService.run({}, this.context)` → log returned user.
3. `await TestAlertRepository.findPendingByHospital(user.hospitalId, { limit, offset })` → log returned `{ rows, count }`.
4. Map rows to response shape:
   ```js
   {
     uuid:         alert.uuid,
     alertType:    alert.alertType,
     relatedTo:    `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim(),
     testName:     testCategory.testName,
     receivedDate: testResult.createdAt,
     raisedOn:     alert.createdAt
   }
   ```
5. Return `{ message: 'OK', rows: mapped, count }`.

### Repository (external)

`infrastructure/repositories/testAlertRepository.js`:

```js
findPendingByHospital(hospitalId, { limit, offset }) {
  return TestAlert.findAndCountAll({
    where: { acknowledgedAt: null },
    include: [{
      model: TestResult,
      as: 'testResult',
      required: true,
      where: { hospitalId },
      include: [
        { model: Patient,      as: 'patient',      attributes: ['firstName', 'lastName'] },
        { model: TestCategory, as: 'testCategory', attributes: ['testName'] }
      ]
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    raw: true,
    nest: true
  })
}
```

### Presenter

`presenters/dashboard/getPendingActions.presenter.js`:

```js
{ message: data.message || 'OK', data: { rows: data.rows, count: data.count } }
```

### Permission alias

`'dashboard/pending-actions': 'CORPORATE'`

---

## External: `POST /dashboard/pending-actions/acknowledge`

### Service

`fsg_client_backend/src/services/dashboard/acknowledgeAlerts.service.js`

Args (body):

```js
{
  type: 'object',
  properties: {
    uuids: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1, maxItems: 100 }
  },
  required: ['uuids']
}
```

`run()` outline:

1. Pull `logger` from context.
2. `await ValidateUserHospitalService.run({}, this.context)` → log returned user.
3. `await TestAlertRepository.findByUuidsScopedToHospital(uuids, user.hospitalId)` → log returned alerts.
4. `toAck = found.filter(a => a.acknowledgedAt === null).map(a => a.id)`.
5. `await TestAlertRepository.bulkAcknowledge(toAck, { acknowledgedAt: new Date(), acknowledgedByUserId: user.id })` → log returned update count.
6. Return `{ message: 'OK', acknowledgedCount: toAck.length }`.

**Failure mode:** best-effort. Uuids that are not found, belong to a different hospital, or are already acknowledged are silently dropped from the count. No `skipped` array in the response. No `TestAlertNotFoundErrorType` / `TestAlertAlreadyAcknowledgedErrorType` — those error types are NOT introduced by this spec.

### Repository (external) — additional methods

```js
findByUuidsScopedToHospital(uuids, hospitalId) {
  return TestAlert.findAll({
    where: { uuid: uuids },
    include: [{ model: TestResult, as: 'testResult', where: { hospitalId }, required: true }],
    raw: true,
    nest: true
  })
}

bulkAcknowledge(ids, fields) {
  return TestAlert.update(fields, { where: { id: ids } })
}
```

### Presenter

`presenters/dashboard/acknowledgeAlerts.presenter.js`:

```js
{ message: data.message || 'OK', data: { acknowledgedCount: data.acknowledgedCount } }
```

### Permission alias + module list

- `'dashboard/pending-actions/acknowledge': 'CORPORATE'`
- Extend `PERMISSIONS.CORPORATE` from `['R']` to `['R', 'C']` so POST (`C` action) is permitted.

---

## File-level change summary

### `fsg_internal_backend`

**New:**
- `src/db/migrations/<timestamp>-create-test-alerts.js`
- `src/db/models/testAlert.model.js`
- `src/services/testAlert/createRejectedAlertsForTests.service.js`
- `src/services/testAlert/createCriticalAlertIfHighRisk.service.js`
- `src/utils/criticalRiskDetector.utils.js`
- `src/infrastructure/repositories/testAlertRepository.js`

**Modified:**
- `src/libs/constants.js` — add `ALERT_TYPE`
- `src/services/formRequest/submitFormRequest.service.js` — call `CreateRejectedAlertsForTestsService.run` after `CreateTestsBulkService.run`
- `src/services/recordManagement/releaseDocument.service.js` — extend `ValidateDocInstanceByUuidService` attributes; call `CreateCriticalAlertIfHighRiskService.run` after the release update

### `fsg_client_backend`

**New:**
- `src/db/models/testAlert.model.js`
- `src/services/dashboard/getPendingActions.service.js`
- `src/services/dashboard/acknowledgeAlerts.service.js`
- `src/presenters/dashboard/getPendingActions.presenter.js`
- `src/presenters/dashboard/acknowledgeAlerts.presenter.js`
- `src/infrastructure/repositories/testAlertRepository.js`

**Modified:**
- `src/libs/constants.js` — add `ALERT_TYPE`
- `src/libs/permissions.js` — add aliases for both endpoints; extend `PERMISSIONS.CORPORATE` to `['R', 'C']`
- `src/rest-resources/controllers/dashboard.controller.js` — add `getPendingActions` + `acknowledgeAlerts` static methods (each using `Service.execute(args, ctx, Presenter)` + `sendResponse`)
- `src/rest-resources/routes/api/v1/dashboard.routes.js` — register two new routes with full middleware chain + request/response schemas

---

## Logging discipline (project-wide rule)

Every call boundary inside a service/controller that returns a value gets a single-line `logger.info` immediately after, logging the **raw return value** (`{ key: JSON.stringify(rawReturn) }`) — no field cherry-picking, no `.toISOString()` / `.toString()`, no blank line between the call and its log. See `claude.md → Logging Pattern` and the saved feedback memories for full rationale.

This applies to every new/modified file in this spec.

---

## Testing / verification

Manual smoke matrix — no automated test framework in this project.

### Internal write paths

- **Submit with one rejected test:**
  - Submit a form request including a test with `status='rejected'` + a valid `rejectionReasonId`.
  - Expect: exactly one row in `test_alerts` with `alert_type='rejected'`, `test_result_id` pointing to the new test, `acknowledged_at IS NULL`.
- **Submit with all accepted:**
  - Expect: zero new rows in `test_alerts`.
- **Release with HIGH RISK in trisomy group:**
  - Release a doc instance where `manualFieldValues.trisomyScreeningResults.trisomy1 = 'HIGH RISK'`.
  - Expect: one new row with `alert_type='critical'`, `test_result_id = docInstance.testResultId`.
- **Release with HIGH RISK in chromosome group:**
  - Release a doc instance where `manualFieldValues.otherChromosomeScreeningResults.chromosome22 = 'HIGH RISK'`.
  - Expect: one new critical row.
- **Release with all Low Risk:**
  - Expect: zero new rows.
- **Release with no manualFieldValues key at all (edge case):**
  - Expect: zero new rows.

### External read/ack

- `GET /api/v1/dashboard/pending-actions` → 200, returns un-acked alerts whose test belongs to the caller's hospital, ordered by `raisedOn DESC`. Response shape:
  ```json
  {
    "data": {
      "message": "OK",
      "data": {
        "rows": [
          { "uuid": "...", "alertType": "rejected", "relatedTo": "Jane Doe", "testName": "...", "receivedDate": "...", "raisedOn": "..." }
        ],
        "count": 1
      }
    }
  }
  ```
- `POST /api/v1/dashboard/pending-actions/acknowledge` with `{ "uuids": ["<valid-uuid>"] }` → 200 `{ acknowledgedCount: 1 }`; row's `acknowledged_at` + `acknowledged_by_user_id` populated.
- Repeat same POST → 200 `{ acknowledgedCount: 0 }` (already acked, silently skipped).
- POST with a mix of valid + invalid uuids → 200 with `acknowledgedCount` equal to the valid un-acked subset only.
- POST with a uuid that belongs to a different hospital → silently dropped (200 `{ acknowledgedCount: 0 }`).
- After ack → that alert no longer appears in the next `GET /pending-actions`.
- Non-corporate user → permission denied on both endpoints.

---

## Open follow-ups (out of scope for this spec)

- PDF download gating using `download_acknowledged_at` — the column exists; the endpoint that sets it and the gating logic inside the doc-instance PDF download path are deferred to a separate sub-project.
- Doctor / patient pending-actions surfaces, if needed.
- Generalize the HIGH RISK detector beyond the two NIPT groups if other test categories grow critical-result semantics.
