# Corporate Dashboard — Design Spec

**Date:** 2026-05-12
**Scope:** `fsg_client_backend` only (external/client backend).
**Audience:** Corporate role users (`FSG:CORPORATE`).

## Goals

Expose two new authenticated endpoints that power the corporate-facing analytics dashboard:

1. `GET /api/v1/dashboard/overview` — combined document-status overview (donut + legend) and status-overview KPI strip (5 metrics).
2. `GET /api/v1/dashboard/test-category-distribution` — stacked monthly breakdown of tests by category, plus the year selector's available years.

Both endpoints are scoped to the caller's hospital (resolved from `auth.id → user.hospitalId`).

## Non-goals

- No new endpoints for any other role.
- No mutations / write paths.
- No caching layer (raw queries are fast enough at current data scale; revisit if/when profiling shows a bottleneck).
- No raw `SampleRejectionReason` surfacing — we only count rejected samples; the reason is not exposed.

---

## Endpoint A — `GET /api/v1/dashboard/overview`

Combines metric (1) Document Status Overview and metric (3) Status Overview (5 parts), driven by a single date window.

### Request

Query params (route-validated):

```js
{
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },   // 'YYYY-MM-DD'
    to:   { type: 'string', format: 'date' }
  },
  dependentRequired: { from: ['to'], to: ['from'] },  // both or neither
  additionalProperties: false
}
```

**Default window** (when neither is provided) = the **current calendar month**, UTC:

```
from = first day of current UTC month, 00:00:00.000Z
to   = last day  of current UTC month, 23:59:59.999Z
```

**Validation contract:**

- AJV rejects `from` without `to` (and vice versa) with 400.
- AJV rejects malformed date strings.
- Service rejects `from > to` (after parsing) with `InvalidDateRangeErrorType`.
- Future-dated windows are accepted (will simply return zero counts).

### Response

```jsonc
{
  "message": "OK",
  "data": {
    "from": "2026-05-01",
    "to":   "2026-05-31",
    "docStatusOverview": {
      "total": 1248,
      "segments": [
        { "status": "received",         "count": 252, "percentage": 20 },
        { "status": "pending-review",   "count": 385, "percentage": 31 },
        { "status": "pending-approval", "count": 88,  "percentage": 7  },
        { "status": "released",         "count": 305, "percentage": 24 }
      ]
    },
    "statusOverview": {
      "testCount":      950,
      "processingRate": 28,
      "pendingAction":  47,
      "rejectedRate": {
        "totalSamples":    980,
        "rejectedSamples": 21,
        "rejectedRate":    2
      },
      "testConducted":  270
    }
  }
}
```

### Metric definitions

All metrics are **hospital-scoped** via `auth.id → user.hospitalId`. All DocInstance metrics are **scoped to the record-management `DocTemplate`** (template type `'recordManagement'`).

#### (1) Document Status Overview — `data.docStatusOverview`

Four buckets, always returned in this fixed order regardless of count:

| Bucket             | Source                                                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `received`         | Count of record-management `DocInstance` rows with `status ∈ { reserved, pendingAnalysis, pendingPreview }`, **plus** count of `TestResult` rows where `status='completed'` AND `labStatus='record-management'` AND no record-management `DocInstance` exists.  |
| `pending-review`   | Count of record-management `DocInstance` rows with `status='pendingReview'`.                                                                                                                                                                                    |
| `pending-approval` | Count of record-management `DocInstance` rows with `status='pendingApproval'`.                                                                                                                                                                                  |
| `released`         | Count of record-management `DocInstance` rows with `status='released'`.                                                                                                                                                                                         |

- `DocInstance.status='auto'` is intentionally never bucketed (belongs to the test-tracker template).
- The date window is applied to `TestResult.createdAt` (DocInstance metrics are joined through TestResult).
- `total = sum of all four bucket counts`.
- `percentage = Math.round(bucketCount / total * 100)`. When `total = 0`, every `percentage` is `0`.
- Mutually exclusive: each TestResult contributes to exactly one bucket (the "received" missing-doc-instance case targets tests whose record-mgmt doc hasn't been created yet).

#### (3) Status Overview — `data.statusOverview`

Five-part KPI strip:

| Field            | Definition                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testCount`      | Count of all `TestResult` rows for this hospital with `createdAt` in `[from, to]`.                                                                  |
| `processingRate` | `Math.round(released / testCount * 100)`. `released` = record-management `DocInstance` with `status='released'`. Returns `0` when `testCount = 0`.  |
| `pendingAction`  | Count of record-management `DocInstance` rows with `status ∈ { pendingReview, pendingApproval }`.                                                   |
| `rejectedRate`   | Object: `{ totalSamples, rejectedSamples, rejectedRate }`. See below.                                                                               |
| `testConducted`  | Count of record-management `DocInstance` rows with `status='released'` (same value as the released bucket in metric 1).                             |

`rejectedRate` operates on the `Sample` table (a different entity from TestResult):

- `totalSamples`    = count of `Sample` rows where the linked `SampleDelivery.hospital_id = X` and `Sample.createdAt` is in `[from, to]`.
- `rejectedSamples` = same query restricted to `Sample.status = 'rejected'`.
- `rejectedRate`    = `Math.round(rejectedSamples / totalSamples * 100)`. Returns `0` when `totalSamples = 0`.

---

## Endpoint B — `GET /api/v1/dashboard/test-category-distribution`

### Request

```js
{
  type: 'object',
  properties: {
    year: { type: ['number', 'string'], minimum: 2000, maximum: 2100 }
  },
  additionalProperties: false
}
```

Default `year` = `new Date().getUTCFullYear()`.

### Response

```jsonc
{
  "message": "OK",
  "data": {
    "year": 2026,
    "availableYears": [2024, 2025, 2026],
    "categories": ["Cellular Therapy", "Genomics", "Molecular Testing"],
    "months": [
      { "month": 0, "counts": { "Molecular Testing": 24, "Genomics": 18 } },
      { "month": 1, "counts": { "Molecular Testing": 31, "Genomics": 22, "Cellular Therapy": 5 } },
      { "month": 3, "counts": { "Molecular Testing": 28, "Cellular Therapy": 2 } }
    ],
    "yearTotal": 130
  }
}
```

### Rules

- `availableYears`: distinct years extracted from `TestResult.createdAt` for this hospital, ascending. Years with zero tests are **excluded** entirely, even the current year.
- `categories`: `TestCategory.testName` values that appear at least once for this hospital in the chosen year, returned in **alphabetical order** so the UI's color-index mapping is stable across requests.
- `months[]`:
  - **Omit** any month whose total across every category is `0` (i.e., no tests at all that month).
  - Kept months preserve their 0-indexed `month` value (`0=January`, `11=December`); skipped months leave gaps (e.g., `[0, 1, 3]`).
  - Within a kept month, the `counts` object **only contains categories whose count is > 0** that specific month. Categories with `0` are absent.
- `yearTotal`: sum of every count across every kept month.
- If the hospital has zero tests in the chosen year: `categories: []`, `months: []`, `yearTotal: 0`, but `availableYears` still reflects years that *do* have data.

---

## Architecture

### File layout (additions only)

```
src/
├── rest-resources/
│   ├── routes/api/v1/
│   │   ├── dashboard.routes.js                       (NEW)
│   │   └── index.js                                  (EXTENDED — register /dashboard)
│   └── controllers/
│       └── dashboard.controller.js                   (NEW)
├── services/dashboard/                               (NEW)
│   ├── getOverview.service.js                        (orchestrator)
│   ├── helper/
│   │   ├── getDocStatusOverview.service.js           (worker — metric 1)
│   │   └── getStatusOverview.service.js              (worker — metric 3)
│   └── getTestCategoryDistribution.service.js        (standalone)
├── presenters/dashboard/                             (NEW)
│   ├── getOverview.presenter.js
│   └── getTestCategoryDistribution.presenter.js
├── infrastructure/repositories/
│   ├── sampleRepository.js                           (NEW)
│   ├── testResultRepository.js                       (EXTENDED — 4 new methods)
│   └── docInstanceRepository.js                      (EXTENDED — 1 new method)
├── db/models/
│   ├── sample.model.js                               (NEW — minimal)
│   └── sampleDelivery.model.js                       (NEW — minimal)
├── libs/
│   ├── permissions.js                                (EXTENDED — 2 alias entries)
│   ├── constants.js                                  (EXTENDED — SAMPLE_STATUS)
│   └── errorTypes.js                                 (EXTENDED — InvalidDateRangeErrorType)
└── utils/
    └── dashboardDateWindow.utils.js                  (NEW — resolveWindow helper)
```

### Authentication & permissions

- Routes use the existing middleware chain: `contextMiddleware(false) → authenticationMiddleware → checkPermission → requestValidationMiddleware → Controller → responseValidationMiddleware`.
- `checkPermission` reads the URL prefix and looks up the required module via `PERMISSION_TYPE.aliases`. Add:

  ```js
  // src/libs/permissions.js — extend PERMISSION_TYPE.aliases
  'dashboard/overview':                    'CORPORATE',
  'dashboard/test-category-distribution':  'CORPORATE'
  ```

  `PERMISSIONS.CORPORATE = ['R']` already exists; no further change needed.

- The corporate user's `hospitalId` is **not** preloaded by middleware. Each service calls `UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })` and returns `AccountNotLinkedErrorType` if missing — matches the pattern in `GetCorporatePatientsReportService`.

### Service orchestration

`GetOverviewService` is the **orchestrator** for endpoint A. It:

1. Resolves the date window (parses `from`/`to` or computes the calendar-month default).
2. Validates `from <= to`.
3. Resolves the corporate user's `hospitalId`.
4. Runs `GetDocStatusOverviewService` and `GetStatusOverviewService` in parallel via `Promise.all`, both using `ServiceBase.execute(args, context)`.
5. Stitches their results into a single object, returns it to the framework. The orchestrator's presenter wraps it.

Workers extend `ServiceBase`, define their own `constraints` to validate `{ hospitalId, from, to }`, and return a plain object the orchestrator picks up via `instance.result`. Workers **do not** call any presenter.

`GetTestCategoryDistributionService` is standalone (one metric only, no orchestration needed).

### Note on duplicate queries

Both workers (`GetDocStatusOverviewService` and `GetStatusOverviewService`) call `DocInstanceRepository.countByStatusForHospitalRecordMgmt`. The query runs twice per overview call. This is an intentional trade-off — keeps each worker self-contained per the user's "each one doing its own job" preference. At current scale (parallel execution, simple aggregate query, no joins beyond `test_results`), the duplication cost is negligible. If profiling later reveals it matters, hoist the query into the orchestrator and pass the result down.

---

## Detailed designs

### New models

#### `src/db/models/sample.model.js`

Minimal — only the columns the dashboard queries against. Mirrors `paranoid: true` from the internal model so soft-deleted rows are auto-excluded.

```js
'use strict'

export default (sequelize, DataTypes) => {
  const Sample = sequelize.define('Sample', {
    id:               { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
    sampleDeliveryId: { type: DataTypes.BIGINT, allowNull: false, field: 'sample_delivery_id' },
    status:           { type: DataTypes.STRING, allowNull: true },
    createdAt:        { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt:        { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
    deletedAt:        { type: DataTypes.DATE, allowNull: true,  field: 'deleted_at' }
  }, {
    sequelize, tableName: 'samples', schema: 'public',
    underscored: true, timestamps: true, paranoid: true
  })

  Sample.associate = models => {
    Sample.belongsTo(models.SampleDelivery, { foreignKey: 'sampleDeliveryId', as: 'sampleDelivery' })
  }

  return Sample
}
```

#### `src/db/models/sampleDelivery.model.js`

Thinner still — only `hospitalId` is queried. Justification for adding this model at all: `samples` has no `hospital_id` column; the only path to filter samples by hospital is via `sample_deliveries.hospital_id`.

```js
'use strict'

export default (sequelize, DataTypes) => {
  const SampleDelivery = sequelize.define('SampleDelivery', {
    id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
    hospitalId: { type: DataTypes.BIGINT, allowNull: true, field: 'hospital_id' },
    createdAt:  { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt:  { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
    deletedAt:  { type: DataTypes.DATE, allowNull: true,  field: 'deleted_at' }
  }, {
    sequelize, tableName: 'sample_deliveries', schema: 'public',
    underscored: true, timestamps: true, paranoid: true
  })

  return SampleDelivery
}
```

No reverse association declared (we only ever query `Sample → SampleDelivery`).

### Constants — extend `src/libs/constants.js`

```js
export const SAMPLE_STATUS = {
  REGISTERED: 'registered',
  IN_TRANSIT: 'in_transit',
  RECEIVED:   'received',
  PROCESSING: 'processing',
  STORED:     'stored',
  RETRIEVED:  'retrieved',
  DISCARDED:  'discarded',
  REJECTED:   'rejected'
}
```

(Full mirror of the internal enum; only `REJECTED` is used today, but keeping the constant authoritative is cheap.)

### Permissions — extend `src/libs/permissions.js`

```js
aliases: {
  // ...existing entries...
  'dashboard/overview':                    'CORPORATE',
  'dashboard/test-category-distribution':  'CORPORATE'
}
```

### Error types — extend `src/libs/errorTypes.js`

Add `InvalidDateRangeErrorType` (HTTP 400, message: "From date must be on or before To date"). Existing `AccountNotLinkedErrorType` is reused unchanged.

### Repository methods

#### `testResultRepository.js` (extend)

```js
/** Total tests for hospital in window. */
static async countByHospital (hospitalId, { from, to }) {
  const { TestResult: TestResultModel } = models
  return TestResultModel.count({
    where: {
      hospitalId,
      createdAt: { [Op.between]: [from, to] }
    }
  })
}

/** Tests with status=completed + labStatus=record-management + no record-mgmt DocInstance. */
static async countCompletedRecordMgmtMissingDocInstance (hospitalId, { from, to }) {
  // Use Sequelize.literal NOT EXISTS for clarity:
  const { TestResult: TestResultModel } = models
  return TestResultModel.count({
    where: {
      hospitalId,
      status:    TEST_RESULT_STATUS.COMPLETED,
      labStatus: LAB_STATUS.RECORD_MANAGEMENT,
      createdAt: { [Op.between]: [from, to] },
      [Op.and]: [
        Sequelize.literal(`NOT EXISTS (
          SELECT 1 FROM doc_instances di
          JOIN doc_templates dt ON di.doc_template_id = dt.id
          WHERE di.test_result_id = "TestResult".id
            AND dt.type = '${DOC_TEMPLATE_TYPE.RECORD_MANAGEMENT}'
        )`)
      ]
    }
  })
}

/** Group test counts by (month-of-year, testCategoryName) for one hospital and year. */
static async countByCategoryMonthly (hospitalId, year) {
  const rows = await sequelize.query(
    `SELECT (EXTRACT(MONTH FROM tr.created_at)::int - 1) AS month,
            tc.test_name AS "categoryName",
            COUNT(*)::int AS count
       FROM test_results tr
       JOIN test_categories tc ON tr.test_category_id = tc.id
      WHERE tr.hospital_id = :hospitalId
        AND EXTRACT(YEAR FROM tr.created_at) = :year
      GROUP BY 1, 2`,
    { replacements: { hospitalId, year }, type: QueryTypes.SELECT }
  )
  return rows  // [{ month, categoryName, count }]
}

/** Distinct years of activity for this hospital. */
static async findAvailableYearsByHospital (hospitalId) {
  const rows = await sequelize.query(
    `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
       FROM test_results
      WHERE hospital_id = :hospitalId
      ORDER BY year ASC`,
    { replacements: { hospitalId }, type: QueryTypes.SELECT }
  )
  return rows.map(r => r.year)
}
```

#### `docInstanceRepository.js` (extend)

```js
/** Per-status counts of record-mgmt DocInstances for this hospital's tests in window. */
static async countByStatusForHospitalRecordMgmt (hospitalId, { from, to }) {
  const rows = await sequelize.query(
    `SELECT di.status, COUNT(*)::int AS count
       FROM doc_instances di
       JOIN test_results tr  ON di.test_result_id  = tr.id
       JOIN doc_templates dt ON di.doc_template_id = dt.id
      WHERE dt.type = :templateType
        AND tr.hospital_id = :hospitalId
        AND tr.created_at BETWEEN :from AND :to
      GROUP BY di.status`,
    {
      replacements: {
        templateType: DOC_TEMPLATE_TYPE.RECORD_MANAGEMENT,
        hospitalId, from, to
      },
      type: QueryTypes.SELECT
    }
  )
  return rows.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
  // → { reserved: N, pendingAnalysis: N, pendingPreview: N, pendingReview: N, pendingApproval: N, released: N }
}
```

#### `sampleRepository.js` (NEW)

```js
import models, { sequelize } from '../../db/models'
import { SAMPLE_STATUS } from '../../libs/constants'

const { Op } = sequelize.Sequelize

class SampleRepository {
  /** Total samples delivered to this hospital in window. */
  static async countByHospital (hospitalId, { from, to }) {
    const { Sample: SampleModel, SampleDelivery: SampleDeliveryModel } = models
    return SampleModel.count({
      where: { createdAt: { [Op.between]: [from, to] } },
      include: [{
        model: SampleDeliveryModel,
        as: 'sampleDelivery',
        where: { hospitalId },
        required: true,
        attributes: []
      }]
    })
  }

  /** Rejected samples delivered to this hospital in window. */
  static async countRejectedByHospital (hospitalId, { from, to }) {
    const { Sample: SampleModel, SampleDelivery: SampleDeliveryModel } = models
    return SampleModel.count({
      where: {
        status: SAMPLE_STATUS.REJECTED,
        createdAt: { [Op.between]: [from, to] }
      },
      include: [{
        model: SampleDeliveryModel,
        as: 'sampleDelivery',
        where: { hospitalId },
        required: true,
        attributes: []
      }]
    })
  }
}

export default SampleRepository
```

### Services

#### `services/dashboard/getOverview.service.js` (orchestrator)

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import UserRepository from '../../infrastructure/repositories/userRepository'
import GetDocStatusOverviewService from './helper/getDocStatusOverview.service'
import GetStatusOverviewService from './helper/getStatusOverview.service'
import { ACCOUNT_TYPE } from '../../libs/constants'
import { resolveWindow, isoDate } from '../../utils/dashboardDateWindow.utils'

const schema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to:   { type: 'string', format: 'date' }
  },
  dependentRequired: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { from, to } = resolveWindow(this.args)

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    logger.info('GetOverviewService: ', {
      message: 'Building corporate dashboard overview',
      context: { userId: JSON.stringify(userId), from: from.toISOString(), to: to.toISOString() }
    })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const workerArgs = { hospitalId: owner.hospitalId, from, to }
    const [docStatusInstance, statusInstance] = await Promise.all([
      GetDocStatusOverviewService.execute(workerArgs, this.context),
      GetStatusOverviewService.execute(workerArgs, this.context)
    ])

    if (!docStatusInstance.successful) { this.mergeErrors(docStatusInstance.errors); return }
    if (!statusInstance.successful)    { this.mergeErrors(statusInstance.errors); return }

    return {
      message: 'OK',
      from: isoDate(from),
      to:   isoDate(to),
      docStatusOverview: docStatusInstance.result,
      statusOverview:    statusInstance.result
    }
  }
}
```

#### `services/dashboard/helper/getDocStatusOverview.service.js` (worker)

```js
import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import TestResultRepository from '../../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../../infrastructure/repositories/docInstanceRepository'

const schema = {
  type: 'object',
  properties: {
    hospitalId: { type: ['number', 'string'] },
    from:       {},
    to:         {}
  },
  required: ['hospitalId', 'from', 'to']
}

const constraints = ajv.compile(schema)

export default class GetDocStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { hospitalId, from, to } = this.args

    const [statusCounts, missing] = await Promise.all([
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      TestResultRepository.countCompletedRecordMgmtMissingDocInstance(hospitalId, { from, to })
    ])

    const received        = (statusCounts.reserved        || 0)
                          + (statusCounts.pendingAnalysis || 0)
                          + (statusCounts.pendingPreview  || 0)
                          + missing
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0
    const released        = statusCounts.released        || 0

    const total = received + pendingReview + pendingApproval + released
    const pct   = n => total === 0 ? 0 : Math.round((n / total) * 100)

    return {
      total,
      segments: [
        { status: 'received',         count: received,        percentage: pct(received) },
        { status: 'pending-review',   count: pendingReview,   percentage: pct(pendingReview) },
        { status: 'pending-approval', count: pendingApproval, percentage: pct(pendingApproval) },
        { status: 'released',         count: released,        percentage: pct(released) }
      ]
    }
  }
}
```

#### `services/dashboard/helper/getStatusOverview.service.js` (worker)

```js
import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import TestResultRepository from '../../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../../infrastructure/repositories/docInstanceRepository'
import SampleRepository from '../../../infrastructure/repositories/sampleRepository'

const schema = {
  type: 'object',
  properties: {
    hospitalId: { type: ['number', 'string'] },
    from:       {},
    to:         {}
  },
  required: ['hospitalId', 'from', 'to']
}

const constraints = ajv.compile(schema)

export default class GetStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { hospitalId, from, to } = this.args

    const [testCount, statusCounts, totalSamples, rejectedSamples] = await Promise.all([
      TestResultRepository.countByHospital(hospitalId, { from, to }),
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      SampleRepository.countByHospital(hospitalId, { from, to }),
      SampleRepository.countRejectedByHospital(hospitalId, { from, to })
    ])

    const released        = statusCounts.released        || 0
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0

    return {
      testCount,
      processingRate: testCount    === 0 ? 0 : Math.round((released        / testCount)    * 100),
      pendingAction:  pendingReview + pendingApproval,
      rejectedRate: {
        totalSamples,
        rejectedSamples,
        rejectedRate: totalSamples === 0 ? 0 : Math.round((rejectedSamples / totalSamples) * 100)
      },
      testConducted: released
    }
  }
}
```

#### `services/dashboard/getTestCategoryDistribution.service.js`

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import UserRepository from '../../infrastructure/repositories/userRepository'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import { ACCOUNT_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    year: { type: ['number', 'string'], minimum: 2000, maximum: 2100 }
  },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetTestCategoryDistributionService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { year } = this.args
    const effectiveYear = Number(year) || new Date().getUTCFullYear()

    logger.info('GetTestCategoryDistributionService: ', {
      message: 'Computing test-category monthly distribution',
      context: { userId: JSON.stringify(userId), year: effectiveYear }
    })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const [rows, availableYears] = await Promise.all([
      TestResultRepository.countByCategoryMonthly(owner.hospitalId, effectiveYear),
      TestResultRepository.findAvailableYearsByHospital(owner.hospitalId)
    ])

    const categoriesSet = new Set()
    const byMonth = {}
    let yearTotal = 0

    for (const { month, categoryName, count } of rows) {
      if (count <= 0) continue
      categoriesSet.add(categoryName)
      yearTotal += count
      if (!byMonth[month]) byMonth[month] = {}
      byMonth[month][categoryName] = count
    }

    const categories = [...categoriesSet].sort()
    const months = Object.keys(byMonth).map(Number).sort((a, b) => a - b)
      .map(m => ({ month: m, counts: byMonth[m] }))

    return { message: 'OK', year: effectiveYear, availableYears, categories, months, yearTotal }
  }
}
```

#### `utils/dashboardDateWindow.utils.js`

```js
const resolveWindow = ({ from, to }) => {
  if (from && to) {
    return {
      from: new Date(from),
      to:   new Date(`${to}T23:59:59.999Z`)
    }
  }
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),     1,  0,  0,  0,   0))
  const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  return { from: start, to: end }
}

const isoDate = (d) => d.toISOString().slice(0, 10)

export { resolveWindow, isoDate }
```

### Presenters

#### `presenters/dashboard/getOverview.presenter.js`

```js
class GetOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        from:              data.from,
        to:                data.to,
        docStatusOverview: data.docStatusOverview,
        statusOverview:    data.statusOverview
      }
    }
  }
}

export default GetOverviewPresenter
```

#### `presenters/dashboard/getTestCategoryDistribution.presenter.js`

```js
class GetTestCategoryDistributionPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        year:            data.year,
        availableYears:  data.availableYears,
        categories:      data.categories,
        months:          data.months,
        yearTotal:       data.yearTotal
      }
    }
  }
}

export default GetTestCategoryDistributionPresenter
```

### Controller — `rest-resources/controllers/dashboard.controller.js`

```js
import GetOverviewService from '../../services/dashboard/getOverview.service'
import GetTestCategoryDistributionService from '../../services/dashboard/getTestCategoryDistribution.service'
import GetOverviewPresenter from '../../presenters/dashboard/getOverview.presenter'
import GetTestCategoryDistributionPresenter from '../../presenters/dashboard/getTestCategoryDistribution.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class DashboardController {
  static async getOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetOverviewService.execute(req.query, req.context, GetOverviewPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getTestCategoryDistribution (req, res, next) {
    try {
      const { result, successful, errors } = await GetTestCategoryDistributionService.execute(req.query, req.context, GetTestCategoryDistributionPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
```

### Route file — `rest-resources/routes/api/v1/dashboard.routes.js`

```js
import express from 'express'
import DashboardController from '../../../controllers/dashboard.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const overviewSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      from: { type: 'string', format: 'date' },
      to:   { type: 'string', format: 'date' }
    },
    dependentRequired: { from: ['to'], to: ['from'] },
    additionalProperties: false
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date' },
            to:   { type: 'string', format: 'date' },
            docStatusOverview: {
              type: 'object',
              properties: {
                total:    { type: 'number' },
                segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status:     { type: 'string', enum: ['received', 'pending-review', 'pending-approval', 'released'] },
                      count:      { type: 'number' },
                      percentage: { type: 'number' }
                    },
                    required: ['status', 'count', 'percentage']
                  }
                }
              },
              required: ['total', 'segments']
            },
            statusOverview: {
              type: 'object',
              properties: {
                testCount:      { type: 'number' },
                processingRate: { type: 'number' },
                pendingAction:  { type: 'number' },
                rejectedRate: {
                  type: 'object',
                  properties: {
                    totalSamples:    { type: 'number' },
                    rejectedSamples: { type: 'number' },
                    rejectedRate:    { type: 'number' }
                  },
                  required: ['totalSamples', 'rejectedSamples', 'rejectedRate']
                },
                testConducted:  { type: 'number' }
              },
              required: ['testCount', 'processingRate', 'pendingAction', 'rejectedRate', 'testConducted']
            }
          },
          required: ['from', 'to', 'docStatusOverview', 'statusOverview']
        }
      },
      required: ['message', 'data']
    }
  }
}

const testCategoryDistributionSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      year: { type: ['number', 'string'], minimum: 2000, maximum: 2100 }
    },
    additionalProperties: false
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            year:           { type: 'number' },
            availableYears: { type: 'array', items: { type: 'number' } },
            categories:     { type: 'array', items: { type: 'string' } },
            months: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month:  { type: 'number', minimum: 0, maximum: 11 },
                  counts: { type: 'object', additionalProperties: { type: 'number' } }
                },
                required: ['month', 'counts']
              }
            },
            yearTotal: { type: 'number' }
          },
          required: ['year', 'availableYears', 'categories', 'months', 'yearTotal']
        }
      },
      required: ['message', 'data']
    }
  }
}

const dashboardRoutes = express.Router()

dashboardRoutes.route('/overview').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(overviewSchemas),
  DashboardController.getOverview,
  responseValidationMiddleware(overviewSchemas)
)

dashboardRoutes.route('/test-category-distribution').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(testCategoryDistributionSchemas),
  DashboardController.getTestCategoryDistribution,
  responseValidationMiddleware(testCategoryDistributionSchemas)
)

export default dashboardRoutes
```

### Route registration — `rest-resources/routes/api/v1/index.js`

```js
import dashboardRoutes from './dashboard.routes'
// ...
router.use('/dashboard', dashboardRoutes)
```

---

## Edge cases

| Case                                                    | Behavior                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Hospital has zero TestResults & zero Samples in window  | All counts `0`, all percentages `0`, `segments` still 4 entries, `months: []`, `categories: []`      |
| Any percentage denominator is `0`                       | Percentage is `0` (never `null`, never `NaN`)                                                        |
| `from = to` (single day)                                | Window is `[from 00:00:00Z, to 23:59:59.999Z]` — one full UTC day                                    |
| `from > to`                                             | `InvalidDateRangeErrorType` (400)                                                                    |
| Only one of `from`/`to`                                 | AJV `dependentRequired` rejects (400)                                                                |
| `from`/`to` far in the future                           | Allowed — returns empty counts                                                                       |
| `year` out of `[2000, 2100]`                            | AJV rejects (400)                                                                                    |
| `year` with no tests for this hospital                  | `categories: []`, `months: []`, `yearTotal: 0`; `availableYears` still lists years that *do* have data |
| Corporate user without `hospitalId`                     | `AccountNotLinkedErrorType` (404-shaped)                                                             |
| Soft-deleted samples (`deleted_at IS NOT NULL`)         | Auto-excluded via `paranoid: true` on Sample model                                                   |
| Concurrent requests                                     | All queries are read-only; no shared state                                                           |

---

## Logging

Per repository's service-style convention: **one purposeful `logger.info` per service entry**, no per-step logs. Orchestrator logs the request once; workers do **not** log (the orchestrator's log already covers the request as a whole).

```js
logger.info('GetOverviewService: ', {
  message: 'Building corporate dashboard overview',
  context: { userId: JSON.stringify(userId), from: from.toISOString(), to: to.toISOString() }
})

logger.info('GetTestCategoryDistributionService: ', {
  message: 'Computing test-category monthly distribution',
  context: { userId: JSON.stringify(userId), year: effectiveYear }
})
```

Repositories do **not** log (per `feedback_no_logger_in_repos`).

---

## Testing

Integration tests, real DB, no mocks (per repo convention):

### `GetOverviewService`

- Empty hospital (zero TestResults, zero Samples) — all counts `0`, percentages `0`, segments still 4 entries.
- Happy path with mixed statuses across all 4 buckets.
- "Received" missing-doc-instance case — completed test + record-mgmt labStatus + no record-mgmt DocInstance contributes 1 to received, not to released.
- `auto` DocInstances ignored — no test-tracker doc instances counted.
- `from > to` → `InvalidDateRangeErrorType`.
- Only one of `from`/`to` → 400 from AJV.
- Default window (omit both) → returns current calendar month.

### `GetStatusOverviewService` (in isolation)

- Zero samples → `rejectedRate: 0`, no divide-by-zero.
- Zero tests → `processingRate: 0`.
- `pendingAction` = pendingReview + pendingApproval (verify exclusion of other statuses).

### `GetDocStatusOverviewService` (in isolation)

- "Received" bucket aggregates `reserved + pendingAnalysis + pendingPreview + (completed-without-record-mgmt-doc)` correctly.

### `GetTestCategoryDistributionService`

- Hospital with no tests in chosen year → empty arrays, `availableYears` still populated from other years.
- Sparse months (skipped April) — confirm month gaps preserved, indices intact.
- Sparse category in a kept month — confirm category absent from that month's `counts`.
- `categories[]` returned in alphabetical order.
- `availableYears` excludes years with zero tests.

### Repository methods

Unit tests with fixture data hitting each new repo method directly. Verify:

- Hospital scoping works (other hospital's data not counted).
- Date window endpoints inclusive (`>=` `from`, `<=` `to`).
- Soft-deleted samples excluded.
- Record-management template filter excludes test-tracker doc instances.

---

## Open questions / future work

- **Caching layer** (materialized view or refresh-on-write counters): not needed today. Revisit when data volume or request rate makes per-call aggregation noticeable.
- **Additional roles** (doctor, accountant): out of scope for this spec — endpoints are corporate-only.
- **Time-zone strategy**: all date math is UTC. If the customer needs hospital-local timezone semantics later, add a `timezone` query param and shift the window accordingly.
- **Frontend integration**: `fsg_front` will consume both endpoints. No spec for the frontend wiring here — it's a separate piece of work.
