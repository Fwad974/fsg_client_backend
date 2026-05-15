# Patient Report Search Filters — Design

**Date:** 2026-05-07
**Scope:** `fsg_client_backend`
**Affects:**
- `src/services/doctor/getDoctorPatientsReport.service.js`
- `src/services/corporate/getCorporatePatientsReport.service.js`
- `src/infrastructure/repositories/testResultRepository.js` — methods `findCompletedReleasedByDoctorId` and `findCompletedReleasedByHospitalId`
- `src/utils/dateRange.utils.js` (new) — `resolveVisitDateRange` helper

## Goal

Add server-side search/filter capability to the two patient-report list endpoints (doctor view and corporate/hospital view) so the frontend can narrow results by visit-date range, patient name, and patient ID.

The two endpoints differ only in the owner column they scope by (`doctorId` vs `hospitalId`); the filter behavior is identical for both. The two services and two repo methods stay separate (no consolidation) — the filter additions are duplicated to each, deliberately.

## Non-Goals

- No frontend changes.
- No repo-method consolidation.
- No new error types.
- No DTO/route signature changes (params arrive via the existing query string).
- No change to default ordering, pagination, included models, or returned shape.

## Request Contract

All new params are **optional**. Filters AND-combine with each other and with the existing `status` / `labStatus` / `docInstanceStatus` constraints.

| Param | Type | Behavior |
|---|---|---|
| `visitDateFrom` | number (epoch ms) | `test_results.created_at >= new Date(effective.from)` |
| `visitDateTo` | number (epoch ms) | `test_results.created_at <= new Date(effective.to)` |
| `reportingDateFrom` | number (epoch ms) | **Fallback for `visitDateFrom`** — used only when `visitDateFrom` is empty. Report-date currently maps to the same column as visit-date (`test_results.created_at`); we never filter that column twice in one query, so the two ranges collapse into one effective range. |
| `reportingDateTo` | number (epoch ms) | **Fallback for `visitDateTo`** — same logic. |

**Effective range resolution:**
```
effective.from = visitDateFrom || reportingDateFrom
effective.to   = visitDateTo   || reportingDateTo
```
Resolved by `resolveVisitDateRange(...)` in `src/utils/dateRange.utils.js`, called from each service before the repo invocation. The repo never sees `reportingDate*`.
| `patientName` | string (≥1 char) | `(patient.first_name ILIKE '%patientName%' OR patient.last_name ILIKE '%patientName%')` |
| `patientId` | string (≥1 char) | `patient.uuid ILIKE 'patientId%'` (starts-with). Maps the user-facing "patient ID" concept to the patient's `uuid` column. |

### Validation Notes

- Date params: `{ type: 'number', minimum: 0 }`. Mirrors the internal-backend precedent at `src/rest-resources/routes/api/v1/export.routes.js:21-22`.
- String filters: `{ type: 'string', minLength: 1 }`. The `minLength: 1` is intentional — empty strings would compile to `ILIKE '%%'`, which matches everything and silently breaks the filter intent.
- No `required` array; every new field is optional.
- No cross-field validation (e.g. `from <= to`) — out of scope; SQL returns empty if `from > to`.

## AJV Schema (identical in both services)

```js
const schema = {
  type: 'object',
  properties: {
    limit:             { type: 'number', minimum: 1, maximum: 100 },
    offset:            { type: 'number', minimum: 0 },
    orderBy:           { type: 'string' },
    orderDirection:    { type: 'string', enum: ['ASC', 'DESC'] },
    visitDateFrom:     { type: 'number', minimum: 0 },
    visitDateTo:       { type: 'number', minimum: 0 },
    reportingDateFrom: { type: 'number', minimum: 0 },
    reportingDateTo:   { type: 'number', minimum: 0 },
    patientName:       { type: 'string', minLength: 1 },
    patientId:         { type: 'string', minLength: 1 }
  }
}
```

## Service Layer Changes

For both `GetDoctorPatientsReportService` and `GetCorporatePatientsReportService`:

1. Import `resolveVisitDateRange` from `src/utils/dateRange.utils.js`.
2. Destructure all 6 new optional fields from `this.args`:
   `visitDateFrom`, `visitDateTo`, `reportingDateFrom`, `reportingDateTo`, `patientName`, `patientId`.
3. Resolve the effective range:
   ```js
   const { from: effectiveVisitDateFrom, to: effectiveVisitDateTo } =
     resolveVisitDateRange({ visitDateFrom, visitDateTo, reportingDateFrom, reportingDateTo })
   ```
4. Pass the resolved range plus `patientName` / `patientId` into the existing repo call alongside `status` / `labStatus` / `docInstanceStatus` / pagination args. The repo only receives `visitDateFrom` / `visitDateTo` (the resolved values) — `reportingDate*` never reaches the repo.
5. Existing `logger.info` already logs `args: JSON.stringify(this.args)` — no new log lines required.
6. No new error types and no new branches that early-return.

Example shape (doctor service):

```js
const { limit, offset, orderBy, orderDirection,
        visitDateFrom, visitDateTo,
        reportingDateFrom, reportingDateTo,
        patientName, patientId } = this.args

const { from: effectiveVisitDateFrom, to: effectiveVisitDateTo } =
  resolveVisitDateRange({ visitDateFrom, visitDateTo, reportingDateFrom, reportingDateTo })

const rows = await TestResultRepository.findCompletedReleasedByDoctorId(owner.doctorId, {
  status:            TEST_RESULT_STATUS.COMPLETED,
  labStatus:         LAB_STATUS.RECORD_MANAGEMENT,
  docInstanceStatus: DOC_INSTANCE_STATUS.RELEASED,
  limit, offset, orderBy, orderDirection,
  visitDateFrom: effectiveVisitDateFrom,
  visitDateTo:   effectiveVisitDateTo,
  patientName, patientId
})
```

Corporate service: identical change, against `findCompletedReleasedByHospitalId(owner.hospitalId, …)`.

## Date-Range Utility (`src/utils/dateRange.utils.js`, new)

Lives next to `error.utils.js` and follows the same export style (function declaration + named export).

```js
function resolveVisitDateRange ({ visitDateFrom, visitDateTo, reportingDateFrom, reportingDateTo }) {
  return {
    from: visitDateFrom || reportingDateFrom,
    to:   visitDateTo   || reportingDateTo
  }
}

export {
  resolveVisitDateRange
}
```

Logic: if `visitDateFrom` is `undefined` / `0` / empty, fall back to `reportingDateFrom`. Same for `to`. If both are empty, the result is `undefined` and the repo skips the date condition entirely. The two ends are resolved independently — e.g. caller can pass `visitDateFrom` plus `reportingDateTo` and get a hybrid effective range. That's not a typical UI flow, but the function permits it because it's the simpler, less-surprising behavior.

## Repository Layer Changes

For both `findCompletedReleasedByDoctorId(doctorId, options)` and `findCompletedReleasedByHospitalId(hospitalId, options)`:

1. Destructure the new options: `visitDateFrom`, `visitDateTo`, `patientName`, `patientId`.
2. Build `where` for `TestResult` from a base of the existing fields plus a conditional `createdAt` range:

   ```js
   const where = { [ownerCol]: ownerValue, status, labStatus }
   if (visitDateFrom || visitDateTo) {
     where.createdAt = {}
     if (visitDateFrom) where.createdAt[Op.gte] = new Date(visitDateFrom)
     if (visitDateTo)   where.createdAt[Op.lte] = new Date(visitDateTo)
   }
   ```

   `new Date(ms)` at the repo boundary mirrors internal precedent (`fsg_internal_backend/src/infrastructure/repositories/testResultRepository.js:1422-1425`).

3. Build a `patientWhere` only when at least one patient filter is set:

   ```js
   const patientWhere = {}
   if (patientName) {
     patientWhere[Op.or] = [
       { firstName: { [Op.iLike]: `%${patientName}%` } },
       { lastName:  { [Op.iLike]: `%${patientName}%` } }
     ]
   }
   if (patientId) {
     patientWhere.uuid = { [Op.iLike]: `${patientId}%` }
   }
   ```

4. On the `patient` include, always pass `where: patientWhere`. Sequelize treats an empty `where: {}` as a no-op and emits no extra SQL conditions, so the conditional spread is unnecessary:

   ```js
   include: [
     {
       model: PatientModel,
       as: 'patient',
       required: true,
       where: patientWhere,
       attributes: ['uuid', 'firstName', 'lastName']
     },
     // … testCategory, docInstances unchanged
   ]
   ```

5. Keep `required: true` on the patient include — this is what makes the patient filter actually narrow the parent result set.
6. `subQuery: false`, `order`, `attributes`, and the `testCategory` / `docInstances` includes stay exactly as today.
7. No logger calls in the repo (per project convention — repos in `fsg_client_backend` are query-only).

## Data Flow

```
HTTP query string
   │  e.g. ?visitDateFrom=1730764800000&patientName=jane
   ▼
Route → AJV schema validates types + minLength + minimum
   ▼
Service.run()
   ├── destructures all 6 filter fields
   ├── resolveVisitDateRange → effective {from, to}
   └── calls repo with effective range (reportingDate* never reaches repo)
   ▼
Repo
   ├── builds test_results.where { ownerCol, status, labStatus, [createdAt range] }
   ├── builds patient include where (Op.or name; uuid starts-with)
   └── findAll(...).map(toJSON)
   ▼
Service returns { message: 'OK', rows, count: rows.length }
```

## Error Handling

- AJV violations: existing route-layer validator returns 400 with the standard error envelope. No change.
- `AccountNotLinkedErrorType`: unchanged — still returned when the user's `doctorId` / `hospitalId` is missing.
- All-empty filters: behavior is unchanged from today (returns paginated full list for the caller's owner).
- `visitDateFrom > visitDateTo`: SQL returns zero rows. Acceptable; not validated.

## Testing Considerations

(Tests are not currently in scope for the project; listing the manual matrix the implementer should walk through.)

- No filters → matches today's response shape and count.
- Only `visitDateFrom` → strict lower bound.
- Only `visitDateTo` → strict upper bound.
- Both visit dates → range narrows correctly.
- `patientName` matches first name only, last name only, both — case-insensitive.
- `patientId` with first 4 chars of a real uuid → finds that patient's tests; with a non-prefix string → returns empty.
- Only `reportingDateFrom` + `reportingDateTo` sent (no `visitDate*`) → behaves exactly like sending `visitDateFrom` / `visitDateTo` (fallback path).
- Both `visitDateFrom` and `reportingDateFrom` sent → `visitDateFrom` wins; `reportingDateFrom` ignored.
- All filters together → AND narrows correctly.
- Empty string for `patientName` or `patientId` → AJV 400 (not silent match-all).
- `limit` / `offset` / `orderBy` / `orderDirection` continue to work alongside filters.

## Out of Scope / Future

- A separate `report_released_at` column (or wiring through the doc instance's `releasedDate`) that would let `reportingDate*` filter a different column from `visitDate*`. Until that exists, the two ranges legitimately point at the same column and report-date filters are a no-op by design.
- Full-name concatenation search (`firstName || ' ' || lastName ILIKE '%query%'`).
- Patient ID exact-match mode or a switch between exact and starts-with.
- Index review for `test_results(created_at)` and `patients(uuid)` under the new query patterns.
