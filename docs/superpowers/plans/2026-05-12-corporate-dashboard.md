# Corporate Dashboard — Implementation Plan

> **Workflow:** Tasks 1–14 build the feature; user approves edits inline. No commits until Task 15 (end of plan). No test framework exists in this repo, so the plan ships without test scaffolding; manual smoke verification at the end.

**Goal:** Add two read-only authenticated endpoints (`/dashboard/overview` and `/dashboard/test-category-distribution`) backing the corporate analytics dashboard, scoped to the caller's hospital.

**Architecture:** Sequelize models + repository methods + ServiceBase orchestrator-with-workers pattern + presenters + controller + Express route, mirroring existing corporate endpoints. Two new minimal models (`Sample`, `SampleDelivery`) so we can query the sample-level rejected-rate metric.

**Spec:** `docs/superpowers/specs/2026-05-12-corporate-dashboard-design.md`

**Tech stack:** Node.js + Express + Sequelize (PostgreSQL) + AJV + ServiceBase.

---

## File map

**New files:**

```
src/db/models/sample.model.js
src/db/models/sampleDelivery.model.js
src/utils/dashboardDateWindow.utils.js
src/infrastructure/repositories/sampleRepository.js
src/services/dashboard/getOverview.service.js
src/services/dashboard/helper/getDocStatusOverview.service.js
src/services/dashboard/helper/getStatusOverview.service.js
src/services/dashboard/getTestCategoryDistribution.service.js
src/presenters/dashboard/getOverview.presenter.js
src/presenters/dashboard/getTestCategoryDistribution.presenter.js
src/rest-resources/controllers/dashboard.controller.js
src/rest-resources/routes/api/v1/dashboard.routes.js
```

**Modified files:**

```
src/libs/constants.js                          (add SAMPLE_STATUS)
src/libs/permissions.js                        (add 2 alias entries)
src/libs/errorTypes.js                         (add InvalidDateRangeErrorType)
src/infrastructure/repositories/testResultRepository.js   (add 4 methods)
src/infrastructure/repositories/docInstanceRepository.js  (add 1 method)
src/rest-resources/routes/api/v1/index.js      (register /dashboard router)
```

---

## Task 1 — Foundation: Sample / SampleDelivery models + SAMPLE_STATUS

**Files:**
- Create: `src/db/models/sample.model.js`
- Create: `src/db/models/sampleDelivery.model.js`
- Modify: `src/libs/constants.js` (append `SAMPLE_STATUS`)

- [ ] **Step 1: Write `src/db/models/sample.model.js`**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const Sample = sequelize.define('Sample', {
    id:               { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
    sampleDeliveryId: { type: DataTypes.BIGINT, allowNull: false, field: 'sample_delivery_id' },
    status:           { type: DataTypes.STRING, allowNull: true },
    createdAt:        { type: DataTypes.DATE,   allowNull: false, field: 'created_at' },
    updatedAt:        { type: DataTypes.DATE,   allowNull: false, field: 'updated_at' },
    deletedAt:        { type: DataTypes.DATE,   allowNull: true,  field: 'deleted_at' }
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

- [ ] **Step 2: Write `src/db/models/sampleDelivery.model.js`**

```js
'use strict'

export default (sequelize, DataTypes) => {
  const SampleDelivery = sequelize.define('SampleDelivery', {
    id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
    hospitalId: { type: DataTypes.BIGINT, allowNull: true, field: 'hospital_id' },
    createdAt:  { type: DataTypes.DATE,   allowNull: false, field: 'created_at' },
    updatedAt:  { type: DataTypes.DATE,   allowNull: false, field: 'updated_at' },
    deletedAt:  { type: DataTypes.DATE,   allowNull: true,  field: 'deleted_at' }
  }, {
    sequelize, tableName: 'sample_deliveries', schema: 'public',
    underscored: true, timestamps: true, paranoid: true
  })

  return SampleDelivery
}
```

- [ ] **Step 3: Append `SAMPLE_STATUS` to `src/libs/constants.js`** (insert immediately after the existing `LAB_STATUS` block; preserve all other content)

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

- [ ] **Step 4: Verify models register on boot**

Run: `npm run dev` (or whatever boot command the team uses) — confirm no Sequelize "model not defined" or "association target missing" errors. Kill the dev server after the log shows "Listening" / equivalent.

---

## Task 2 — Permissions wiring + InvalidDateRangeErrorType

**Files:**
- Modify: `src/libs/permissions.js`
- Modify: `src/libs/errorTypes.js`

- [ ] **Step 1: Add aliases in `src/libs/permissions.js`**

Insert these two lines inside `PERMISSION_TYPE.aliases`, right after the `tests/catalogs` entry:

```js
// corporate dashboard (CORPORATE-only)
'dashboard/overview':                   'CORPORATE',
'dashboard/test-category-distribution': 'CORPORATE'
```

(No change to `PERMISSIONS` — `CORPORATE: ['R']` already exists.)

- [ ] **Step 2: Add `InvalidDateRangeErrorType` to `src/libs/errorTypes.js`**

Append at the bottom of the file. Model exactly after `AccountNotLinkedErrorType` (same shape — `name`, `statusCode`, `isOperational`, `description`, `errorCode`):

```js
export const InvalidDateRangeErrorType = {
  name: 'InvalidDateRange',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'From date must be on or before To date.',
  errorCode: 'INVALID_DATE_RANGE'
}
```

(Reuse the existing `StatusCodes` import already at the top of the file.)

---

## Task 3 — Date-window utility

**Files:**
- Create: `src/utils/dashboardDateWindow.utils.js`

- [ ] **Step 1: Write the helper**

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

- [ ] **Step 2: Sanity check in a Node REPL** (optional)

```bash
node -e "const { resolveWindow, isoDate } = require('./src/utils/dashboardDateWindow.utils'); const w = resolveWindow({}); console.log(isoDate(w.from), isoDate(w.to))"
```

Expected: prints `YYYY-MM-01 YYYY-MM-{lastDay}` for the current UTC month. (Will only work after the Babel toolchain is set up; skip if it errors — the bigger smoke verification at the end will catch problems.)

---

## Task 4 — `sampleRepository.js` (NEW)

**Files:**
- Create: `src/infrastructure/repositories/sampleRepository.js`

- [ ] **Step 1: Write the file**

```js
import models from '../../db/models'
import Sequelize from 'sequelize'
import { SAMPLE_STATUS } from '../../libs/constants'

const { Op } = Sequelize

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

- [ ] **Step 2: Confirm no logger import** (per repo memory rule — repos in fsg_client_backend stay query-only).

---

## Task 5 — `testResultRepository.js` extensions (4 methods)

**Files:**
- Modify: `src/infrastructure/repositories/testResultRepository.js`

Add four static methods. Insert them inside the existing class, after the existing methods, before the closing brace.

- [ ] **Step 1: Ensure imports available at the top of the file**

The file already imports `models` and `Op`. Add (or verify present):

```js
import Sequelize from 'sequelize'
import { QueryTypes } from 'sequelize'
import { TEST_RESULT_STATUS, LAB_STATUS, DOC_TEMPLATE_TYPE } from '../../libs/constants'
```

(If `Sequelize` and `QueryTypes` are already imported, don't duplicate. The constants may already be present too — verify before adding.)

Also pull the `sequelize` instance: at the top of the file, alongside `import models from '../../db/models'`, add:

```js
import { sequelize } from '../../db/models'
```

- [ ] **Step 2: Add `countByHospital`**

```js
static async countByHospital (hospitalId, { from, to }) {
  const { TestResult: TestResultModel } = models
  return TestResultModel.count({
    where: {
      hospitalId,
      createdAt: { [Op.between]: [from, to] }
    }
  })
}
```

- [ ] **Step 3: Add `countCompletedRecordMgmtMissingDocInstance`**

```js
static async countCompletedRecordMgmtMissingDocInstance (hospitalId, { from, to }) {
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
```

- [ ] **Step 4: Add `countByCategoryMonthly`**

```js
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
  return rows
}
```

- [ ] **Step 5: Add `findAvailableYearsByHospital`**

```js
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

---

## Task 6 — `docInstanceRepository.js` extension (1 method)

**Files:**
- Modify: `src/infrastructure/repositories/docInstanceRepository.js`

- [ ] **Step 1: Verify imports**

Ensure these are present at the top of the file. Add what's missing:

```js
import { sequelize } from '../../db/models'
import { QueryTypes } from 'sequelize'
import { DOC_TEMPLATE_TYPE } from '../../libs/constants'
```

- [ ] **Step 2: Add `countByStatusForHospitalRecordMgmt` to the existing class**

```js
static async countByStatusForHospitalRecordMgmt (hospitalId, { from, to }) {
  const rows = await sequelize.query(
    `SELECT di.status, COUNT(*)::int AS count
       FROM doc_instances di
       JOIN test_results  tr ON di.test_result_id  = tr.id
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
}
```

---

## Task 7 — Worker A: `GetDocStatusOverviewService`

**Files:**
- Create: `src/services/dashboard/helper/getDocStatusOverview.service.js`

- [ ] **Step 1: Write the file**

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

---

## Task 8 — Worker B: `GetStatusOverviewService`

**Files:**
- Create: `src/services/dashboard/helper/getStatusOverview.service.js`

- [ ] **Step 1: Write the file**

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

---

## Task 9 — Orchestrator: `GetOverviewService`

**Files:**
- Create: `src/services/dashboard/getOverview.service.js`

- [ ] **Step 1: Write the file**

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

---

## Task 10 — Standalone: `GetTestCategoryDistributionService`

**Files:**
- Create: `src/services/dashboard/getTestCategoryDistribution.service.js`

- [ ] **Step 1: Write the file**

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

---

## Task 11 — Presenters

**Files:**
- Create: `src/presenters/dashboard/getOverview.presenter.js`
- Create: `src/presenters/dashboard/getTestCategoryDistribution.presenter.js`

- [ ] **Step 1: `getOverview.presenter.js`**

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

- [ ] **Step 2: `getTestCategoryDistribution.presenter.js`**

```js
class GetTestCategoryDistributionPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        year:           data.year,
        availableYears: data.availableYears,
        categories:     data.categories,
        months:         data.months,
        yearTotal:      data.yearTotal
      }
    }
  }
}

export default GetTestCategoryDistributionPresenter
```

---

## Task 12 — Controller

**Files:**
- Create: `src/rest-resources/controllers/dashboard.controller.js`

- [ ] **Step 1: Write the file**

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

---

## Task 13 — Route file

**Files:**
- Create: `src/rest-resources/routes/api/v1/dashboard.routes.js`

- [ ] **Step 1: Write the file**

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

---

## Task 14 — Register `/dashboard` router

**Files:**
- Modify: `src/rest-resources/routes/api/v1/index.js`

- [ ] **Step 1: Add the import**

Append after the existing `contactRequestsRoutes` import:

```js
import dashboardRoutes from './dashboard.routes'
```

- [ ] **Step 2: Add the mount line**

Append after the existing `v1Router.use('/contact-requests', contactRequestsRoutes)` line:

```js
v1Router.use('/dashboard', dashboardRoutes)
```

---

## Task 15 — Smoke verification

The repo has no test framework; verification is manual against a live dev server.

- [ ] **Step 1: Boot the dev server**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
npm run dev   # or whatever boots the app
```

Expected: no Sequelize "model not defined" / "association target missing" errors. Server listens on its usual port.

- [ ] **Step 2: Get a corporate user's bearer token**

Use the existing login endpoint (or pull one from the team's test fixtures). Replace `$TOKEN` below.

- [ ] **Step 3: Hit `/dashboard/overview` (default current month)**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:$PORT/api/v1/dashboard/overview | jq
```

Expected: status 200, body shape:

```json
{
  "data": {
    "message": "OK",
    "data": {
      "from": "YYYY-MM-01",
      "to":   "YYYY-MM-{last-day}",
      "docStatusOverview": { "total": ..., "segments": [4 entries] },
      "statusOverview": { "testCount": ..., "processingRate": ..., "pendingAction": ..., "rejectedRate": { ... }, "testConducted": ... }
    }
  },
  "errors": []
}
```

Verify: `segments` has exactly 4 entries in fixed order (`received`, `pending-review`, `pending-approval`, `released`); `rejectedRate` is an object; `pendingAction` is a single number; no NaN/null in percentages.

- [ ] **Step 4: Hit `/dashboard/overview` with explicit date range**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/v1/dashboard/overview?from=2026-01-01&to=2026-05-31" | jq
```

Expected: status 200, same shape, `from`/`to` echo the request.

- [ ] **Step 5: Hit `/dashboard/overview` with invalid range** (`from > to`)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/v1/dashboard/overview?from=2026-12-01&to=2026-01-01"
```

Expected: HTTP 400, error code `INVALID_DATE_RANGE`.

- [ ] **Step 6: Hit `/dashboard/overview` with only one date** (`from` without `to`)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/v1/dashboard/overview?from=2026-01-01"
```

Expected: HTTP 400 from AJV (request validation error).

- [ ] **Step 7: Hit `/dashboard/test-category-distribution` with default year**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/v1/dashboard/test-category-distribution" | jq
```

Expected: status 200, body has `year`, `availableYears`, `categories` (sorted alphabetically), `months` (sparse, every entry has `month` 0–11), `yearTotal`. Verify: no month entry has a category with count `0`; `availableYears` excludes years with zero tests.

- [ ] **Step 8: Hit `/dashboard/test-category-distribution` with an explicit year**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/v1/dashboard/test-category-distribution?year=2024" | jq
```

Expected: shape same as Step 7, with `year: 2024`.

- [ ] **Step 9: Hit either endpoint without auth**

```bash
curl -i "http://localhost:$PORT/api/v1/dashboard/overview"
```

Expected: HTTP 401 (`InvalidSessionErrorType` or equivalent — depending on `authenticationMiddleware`).

- [ ] **Step 10: Hit either endpoint as a non-corporate user** (patient or doctor token)

```bash
curl -i -H "Authorization: Bearer $PATIENT_TOKEN" "http://localhost:$PORT/api/v1/dashboard/overview"
```

Expected: HTTP 403 (`InvalidAccessErrorType` from `checkPermission`).

If any step fails, stop and triage before moving on.

---

## Task 16 — Wrap-up: propose commits

Per user direction, commits are deferred to the end of the plan. After Task 15 passes:

- [ ] **Step 1: Run `git status`**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend
git status --short
```

Expected list (in addition to the already-tracked spec + plan docs):

```
M  src/libs/constants.js
M  src/libs/permissions.js
M  src/libs/errorTypes.js
M  src/infrastructure/repositories/testResultRepository.js
M  src/infrastructure/repositories/docInstanceRepository.js
M  src/rest-resources/routes/api/v1/index.js
?? src/db/models/sample.model.js
?? src/db/models/sampleDelivery.model.js
?? src/infrastructure/repositories/sampleRepository.js
?? src/utils/dashboardDateWindow.utils.js
?? src/services/dashboard/
?? src/presenters/dashboard/
?? src/rest-resources/controllers/dashboard.controller.js
?? src/rest-resources/routes/api/v1/dashboard.routes.js
?? docs/superpowers/specs/2026-05-12-corporate-dashboard-design.md
?? docs/superpowers/plans/2026-05-12-corporate-dashboard.md
```

- [ ] **Step 2: Propose commit grouping to the user**

Recommended grouping (Claude proposes — user authorizes):

1. **Docs** — the spec + plan files in `docs/superpowers/`. Subject: `docs(dashboard): spec + plan for corporate dashboard endpoints`.
2. **Foundation** — new models, `SAMPLE_STATUS`, `InvalidDateRangeErrorType`, permissions alias. Subject: `feat(dashboard): add Sample + SampleDelivery models, SAMPLE_STATUS, permissions wiring`.
3. **Repositories** — sampleRepository + testResultRepository + docInstanceRepository extensions. Subject: `feat(dashboard): add repository methods for dashboard aggregates`.
4. **Services + presenters + controller + route** — everything in `services/dashboard/`, `presenters/dashboard/`, `dashboard.controller.js`, `dashboard.routes.js`, the `index.js` registration, the date-window util. Subject: `feat(dashboard): add corporate overview + test-category-distribution endpoints`.

Wait for user authorization before running `git add` / `git commit`. No `Co-Authored-By` trailer (per memory rule).

---

## Self-review notes

Spec coverage check:

- Document Status Overview (4 buckets, "received" merges 3 doc-statuses + "completed-without-record-mgmt-doc"): Task 5 (`countCompletedRecordMgmtMissingDocInstance`) + Task 6 (`countByStatusForHospitalRecordMgmt`) + Task 7 (worker assembles buckets).
- Status Overview (5 KPIs incl. rejected-rate over Samples): Tasks 4 (sample repo) + 5 (testResult `countByHospital`) + 6 (docInstance status counts) + 8 (worker stitches).
- Test Category Distribution (monthly, sparse, availableYears excludes zero-test years, categories alphabetical, intra-month sparse): Task 5 (`countByCategoryMonthly`, `findAvailableYearsByHospital`) + Task 10 (service folds rows, filters `count <= 0`, sorts).
- Permissions wiring: Task 2.
- New error type: Task 2.
- Route registration: Task 14.
- Logging convention (orchestrator logs once, workers don't): Task 9 logs; Tasks 7+8 do not.
- Edge cases (zero division, `from > to`, future dates, default current-month window): handled in Tasks 3 (utility), 7, 8, 9, 10.

No `TODO` / `TBD` placeholders. Method signatures consistent across services and repos (`countByHospital(hospitalId, { from, to })` shape used everywhere).
