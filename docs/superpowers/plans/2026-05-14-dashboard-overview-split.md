# Dashboard `/overview` Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `GET /api/v1/dashboard/overview` into `/doc-status-overview` and `/kpi-overview`, introduce a reusable `ValidateUserHospitalService` for corporate hospital-link checks, and refactor three existing corporate services to use it.

**Architecture:** Each new endpoint is a top-level service that independently resolves the date window and delegates the corporate hospital-link check to `ValidateUserHospitalService.run({}, this.context)`. Service-to-service calls use `.run()` (throws on error); controllers use `.execute()`. Every call boundary inside services/controllers logs its return value on a single line.

**Tech Stack:** Node.js, Express, Sequelize, ServiceBase (custom), AJV JSON Schema, `standard` linter. No automated test framework; verification is manual smoke testing against a corporate test account.

**Spec:** `docs/superpowers/specs/2026-05-14-dashboard-overview-split-design.md`

**Project conventions (saved memory):**

- Service-to-service: `Service.run(args, context)` — throws on `addError`, returns raw `instance.result`.
- Controllers: `Service.execute(args, context, presenter)` + `sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })`.
- Repos stay query-only — no `logger.*` inside repos.
- Every `await` to a repo / helper service / utility is followed by a single-line `logger.info` capturing the return.
- Helper functions live BELOW `export default class` in the same file.
- Commits are **proposed at the end** of the plan and applied only on user authorization. Do NOT run `git commit` between tasks.

---

## File Structure (locked in)

**New files:**

- `src/services/user/helper/validateUserHospital.service.js`
- `src/services/dashboard/getDocStatusOverview.service.js` (replaces the helper-folder version)
- `src/services/dashboard/getKpiOverview.service.js` (replaces `helper/getStatusOverview.service.js`)
- `src/presenters/dashboard/getDocStatusOverview.presenter.js`
- `src/presenters/dashboard/getKpiOverview.presenter.js`

**Modified:**

- `src/services/corporate/getCorporatePatients.service.js`
- `src/services/corporate/getCorporatePatientsReport.service.js`
- `src/services/dashboard/getTestCategoryDistribution.service.js`
- `src/rest-resources/controllers/dashboard.controller.js`
- `src/rest-resources/routes/api/v1/dashboard.routes.js`
- `src/libs/permissions.js`

**Deleted (at the end, after no references remain):**

- `src/services/dashboard/getOverview.service.js`
- `src/services/dashboard/helper/getDocStatusOverview.service.js`
- `src/services/dashboard/helper/getStatusOverview.service.js`
- `src/services/dashboard/helper/` (empty folder)
- `src/presenters/dashboard/getOverview.presenter.js`

---

## Task 1 — Create `ValidateUserHospitalService`

**Files:**
- Create: `src/services/user/helper/validateUserHospital.service.js`

- [ ] **Step 1: Create the directory if it doesn't exist**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/user/helper
```

- [ ] **Step 2: Write the service**

Create `src/services/user/helper/validateUserHospital.service.js`:

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

- [ ] **Step 3: Lint-check the new file**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/user/helper/validateUserHospital.service.js
```

Expected: clean exit (no output) or any auto-fixable issues reported.

---

## Task 2 — Promote `GetDocStatusOverviewService` to top-level

**Files:**
- Create: `src/services/dashboard/getDocStatusOverview.service.js`

- [ ] **Step 1: Write the new top-level service**

Create `src/services/dashboard/getDocStatusOverview.service.js`:

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
import { resolveWindow } from '../../utils/dashboardDateWindow.utils'
import { percentage } from '../../utils/percentage.utils'

const schema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to:   { type: 'string', format: 'date' }
  },
  dependencies: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetDocStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { from, to } = resolveWindow(this.args)

    logger.info('GetDocStatusOverviewService: ', { message: 'Date window resolved', context: { from: from.toISOString(), to: to.toISOString() } })

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    const user = await ValidateUserHospitalService.run({}, this.context)

    logger.info('GetDocStatusOverviewService: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })

    const { hospitalId } = user

    const [statusCounts, missing] = await Promise.all([
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      TestResultRepository.countCompletedRecordMgmtMissingDocInstance(hospitalId, { from, to })
    ])

    logger.info('GetDocStatusOverviewService: ', { message: 'Doc-status repo counts fetched', context: { statusCounts: JSON.stringify(statusCounts), missing: JSON.stringify(missing) } })

    const received        = (statusCounts.reserved        || 0)
                          + (statusCounts.pendingAnalysis || 0)
                          + (statusCounts.pendingPreview  || 0)
                          + missing
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0
    const released        = statusCounts.released        || 0

    const total = received + pendingReview + pendingApproval + released

    const result = {
      message: 'OK',
      total,
      segments: [
        { status: 'received',         count: received,        percentage: percentage(received,        total) },
        { status: 'pending-review',   count: pendingReview,   percentage: percentage(pendingReview,   total) },
        { status: 'pending-approval', count: pendingApproval, percentage: percentage(pendingApproval, total) },
        { status: 'released',         count: released,        percentage: percentage(released,        total) }
      ]
    }

    logger.info('GetDocStatusOverviewService: ', { message: 'Doc status overview computed', context: { total: JSON.stringify(total) } })

    return result
  }
}
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/dashboard/getDocStatusOverview.service.js
```

Expected: clean exit.

---

## Task 3 — Create `GetKpiOverviewService`

**Files:**
- Create: `src/services/dashboard/getKpiOverview.service.js`

- [ ] **Step 1: Write the new top-level service**

Create `src/services/dashboard/getKpiOverview.service.js`:

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import SampleRepository from '../../infrastructure/repositories/sampleRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
import { resolveWindow } from '../../utils/dashboardDateWindow.utils'
import { percentage } from '../../utils/percentage.utils'

const schema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to:   { type: 'string', format: 'date' }
  },
  dependencies: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetKpiOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { from, to } = resolveWindow(this.args)

    logger.info('GetKpiOverviewService: ', { message: 'Date window resolved', context: { from: from.toISOString(), to: to.toISOString() } })

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    const user = await ValidateUserHospitalService.run({}, this.context)

    logger.info('GetKpiOverviewService: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })

    const { hospitalId } = user

    const [testCount, statusCounts, totalSamples, rejectedSamples] = await Promise.all([
      TestResultRepository.countByHospital(hospitalId, { from, to }),
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      SampleRepository.countByHospital(hospitalId, { from, to }),
      SampleRepository.countRejectedByHospital(hospitalId, { from, to })
    ])

    logger.info('GetKpiOverviewService: ', { message: 'KPI repo counts fetched', context: { testCount: JSON.stringify(testCount), statusCounts: JSON.stringify(statusCounts), totalSamples: JSON.stringify(totalSamples), rejectedSamples: JSON.stringify(rejectedSamples) } })

    const released        = statusCounts.released        || 0
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0

    const result = {
      message: 'OK',
      testCount,
      processingRate: percentage(released, testCount),
      pendingAction:  pendingReview + pendingApproval,
      rejectedRate: {
        totalSamples,
        rejectedSamples,
        rejectedRate: percentage(rejectedSamples, totalSamples)
      },
      testConducted: released
    }

    logger.info('GetKpiOverviewService: ', { message: 'KPI overview computed', context: { testCount: JSON.stringify(testCount), testConducted: JSON.stringify(released) } })

    return result
  }
}
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/dashboard/getKpiOverview.service.js
```

Expected: clean exit.

---

## Task 4 — Create both new presenters

**Files:**
- Create: `src/presenters/dashboard/getDocStatusOverview.presenter.js`
- Create: `src/presenters/dashboard/getKpiOverview.presenter.js`

- [ ] **Step 1: Write `getDocStatusOverview.presenter.js`**

```js
class GetDocStatusOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        total:    data.total,
        segments: data.segments
      }
    }
  }
}

export default GetDocStatusOverviewPresenter
```

- [ ] **Step 2: Write `getKpiOverview.presenter.js`**

```js
class GetKpiOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        testCount:      data.testCount,
        processingRate: data.processingRate,
        pendingAction:  data.pendingAction,
        rejectedRate:   data.rejectedRate,
        testConducted:  data.testConducted
      }
    }
  }
}

export default GetKpiOverviewPresenter
```

- [ ] **Step 3: Lint-check both files**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/presenters/dashboard/getDocStatusOverview.presenter.js src/presenters/dashboard/getKpiOverview.presenter.js
```

Expected: clean exit.

---

## Task 5 — Update `DashboardController`

**Files:**
- Modify: `src/rest-resources/controllers/dashboard.controller.js`

- [ ] **Step 1: Replace the file entirely**

Overwrite `src/rest-resources/controllers/dashboard.controller.js`:

```js
import GetDocStatusOverviewService from '../../services/dashboard/getDocStatusOverview.service'
import GetKpiOverviewService from '../../services/dashboard/getKpiOverview.service'
import GetTestCategoryDistributionService from '../../services/dashboard/getTestCategoryDistribution.service'
import GetDocStatusOverviewPresenter from '../../presenters/dashboard/getDocStatusOverview.presenter'
import GetKpiOverviewPresenter from '../../presenters/dashboard/getKpiOverview.presenter'
import GetTestCategoryDistributionPresenter from '../../presenters/dashboard/getTestCategoryDistribution.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class DashboardController {
  static async getDocStatusOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetDocStatusOverviewService.execute(req.query, req.context, GetDocStatusOverviewPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getKpiOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetKpiOverviewService.execute(req.query, req.context, GetKpiOverviewPresenter)
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

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/rest-resources/controllers/dashboard.controller.js
```

Expected: clean exit.

---

## Task 6 — Update routes

**Files:**
- Modify: `src/rest-resources/routes/api/v1/dashboard.routes.js`

- [ ] **Step 1: Replace the file entirely**

Overwrite `src/rest-resources/routes/api/v1/dashboard.routes.js`:

```js
import express from 'express'
import DashboardController from '../../../controllers/dashboard.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const dateWindowQuerySchema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to:   { type: 'string', format: 'date' }
  },
  dependencies: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const docStatusOverviewSchemas = {
  querySchema: dateWindowQuerySchema,
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number' },
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
        }
      },
      required: ['message', 'data']
    }
  }
}

const kpiOverviewSchemas = {
  querySchema: dateWindowQuerySchema,
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
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
            testConducted: { type: 'number' }
          },
          required: ['testCount', 'processingRate', 'pendingAction', 'rejectedRate', 'testConducted']
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
            availableYears: { type: 'array', items: { type: 'number' } },
            categories:     { type: 'array', items: { type: 'string' } },
            months: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'number', minimum: 0, maximum: 11 },
                  counts: {
                    type: 'object',
                    patternProperties: { '^.+$': { type: 'number' } },
                    additionalProperties: false
                  }
                },
                required: ['month', 'counts']
              }
            },
            yearTotal: { type: 'number' }
          },
          required: ['availableYears', 'categories', 'months', 'yearTotal']
        }
      },
      required: ['message', 'data']
    }
  }
}

const dashboardRoutes = express.Router()

dashboardRoutes.route('/doc-status-overview').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(docStatusOverviewSchemas),
  DashboardController.getDocStatusOverview,
  responseValidationMiddleware(docStatusOverviewSchemas)
)

dashboardRoutes.route('/kpi-overview').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(kpiOverviewSchemas),
  DashboardController.getKpiOverview,
  responseValidationMiddleware(kpiOverviewSchemas)
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

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/rest-resources/routes/api/v1/dashboard.routes.js
```

Expected: clean exit.

---

## Task 7 — Update permission aliases

**Files:**
- Modify: `src/libs/permissions.js`

- [ ] **Step 1: Swap the alias**

In `src/libs/permissions.js`, replace:

```js
    // corporate dashboard (CORPORATE-only)
    'dashboard/overview':                   'CORPORATE',
    'dashboard/test-category-distribution': 'CORPORATE'
```

with:

```js
    // corporate dashboard (CORPORATE-only)
    'dashboard/doc-status-overview':        'CORPORATE',
    'dashboard/kpi-overview':               'CORPORATE',
    'dashboard/test-category-distribution': 'CORPORATE'
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/libs/permissions.js
```

Expected: clean exit.

---

## Task 8 — Refactor `getCorporatePatients.service.js`

**Files:**
- Modify: `src/services/corporate/getCorporatePatients.service.js`

- [ ] **Step 1: Open the file and locate lines 1-8 (imports) and 23-32 (run body)**

The current top of file is:
```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { ACCOUNT_TYPE } from '../../libs/constants'
```

The current `run()` body contains:
```js
    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const { rows, count } = await PatientRepository.findAllByHospitalId(owner.hospitalId, { limit, offset, search, orderBy, orderDirection })
```

- [ ] **Step 2: Replace the imports**

Replace lines 3-5 (`PatientRepository`, `UserRepository`, `ACCOUNT_TYPE`) with:

```js
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
```

(Remove `UserRepository` and `ACCOUNT_TYPE` imports — they're no longer used.)

- [ ] **Step 3: Replace the hospital-lookup block inside `run()`**

Replace:
```js
    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const { rows, count } = await PatientRepository.findAllByHospitalId(owner.hospitalId, { limit, offset, search, orderBy, orderDirection })
```

with:
```js
    const user = await ValidateUserHospitalService.run({}, this.context)

    logger.info('GetCorporatePatientsService: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })

    const { rows, count } = await PatientRepository.findAllByHospitalId(user.hospitalId, { limit, offset, search, orderBy, orderDirection })

    logger.info('GetCorporatePatientsService: ', { message: 'Hospital patient list fetched', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })
```

(The trailing pre-existing `logger.info` two lines below — `'Hospital patient list returned'` — stays; you've just added an explicit fetch-log right after the repo call.)

- [ ] **Step 4: Remove `userId` from destructuring if it's no longer used**

Inspect: is `userId` still referenced anywhere in this file? If not, change:
```js
    const { logger, auth: { id: userId } } = this.context
```
to:
```js
    const { logger } = this.context
```

If `userId` is still used (e.g., in a log line), leave the destructure as-is.

- [ ] **Step 5: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/corporate/getCorporatePatients.service.js
```

Expected: clean exit (or `standard --fix`-able issues, run `npm run lint` to auto-fix).

---

## Task 9 — Refactor `getCorporatePatientsReport.service.js`

**Files:**
- Modify: `src/services/corporate/getCorporatePatientsReport.service.js`

- [ ] **Step 1: Read the file**

Run:
```bash
sed -n '1,50p' /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/corporate/getCorporatePatientsReport.service.js
```

Locate the lines containing `UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })` (around line 41) and the import block.

- [ ] **Step 2: Replace imports**

Remove the `UserRepository` import line. Remove the `ACCOUNT_TYPE` import line (only if `ACCOUNT_TYPE` is not referenced anywhere else in the file — check with `grep -c ACCOUNT_TYPE <file>`).

Add immediately after the remaining repository imports:
```js
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
```

- [ ] **Step 3: Replace the inline hospital-lookup**

Replace:
```js
    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')
```

with:
```js
    const user = await ValidateUserHospitalService.run({}, this.context)

    logger.info('GetCorporatePatientsReportService: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })
```

Then update any later reference to `owner.hospitalId` in the file → `user.hospitalId`.

- [ ] **Step 4: Drop `userId` destructure if unused**

Same check as Task 8 Step 4 — only keep `userId` in the context destructure if still referenced.

- [ ] **Step 5: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/corporate/getCorporatePatientsReport.service.js
```

Expected: clean exit.

---

## Task 10 — Refactor `getTestCategoryDistribution.service.js`

**Files:**
- Modify: `src/services/dashboard/getTestCategoryDistribution.service.js`

- [ ] **Step 1: Read the file to confirm shape**

```bash
sed -n '1,40p' /home/kia/Desktop/work/fsg/fsg_client_backend/src/services/dashboard/getTestCategoryDistribution.service.js
```

You're looking for the `UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })` call around line 29.

- [ ] **Step 2: Replace imports**

Remove the `UserRepository` import. Remove `ACCOUNT_TYPE` import only if not referenced elsewhere in the file.

Add:
```js
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
```

- [ ] **Step 3: Replace the inline lookup**

Replace:
```js
    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')
```

with:
```js
    const user = await ValidateUserHospitalService.run({}, this.context)

    logger.info('GetTestCategoryDistributionService: ', { message: 'Hospital link confirmed', context: { hospitalId: JSON.stringify(user.hospitalId) } })
```

Update any later reference from `owner.hospitalId` → `user.hospitalId`.

- [ ] **Step 4: Drop `userId` destructure if unused**

Same check as Task 8 Step 4.

- [ ] **Step 5: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard src/services/dashboard/getTestCategoryDistribution.service.js
```

Expected: clean exit.

---

## Task 11 — Delete obsolete files

**Files:**
- Delete: `src/services/dashboard/getOverview.service.js`
- Delete: `src/services/dashboard/helper/getDocStatusOverview.service.js`
- Delete: `src/services/dashboard/helper/getStatusOverview.service.js`
- Delete: `src/services/dashboard/helper/` (folder, if empty)
- Delete: `src/presenters/dashboard/getOverview.presenter.js`

- [ ] **Step 1: Verify no remaining references**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && grep -rln "getOverview\.service\|GetOverviewService\|helper/getDocStatusOverview\|helper/getStatusOverview\|GetStatusOverviewService\|getOverview\.presenter\|GetOverviewPresenter" src
```

Expected: only the files listed above (the ones we're about to delete) show up — no remaining importers.

- [ ] **Step 2: Remove the files**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && rm \
  src/services/dashboard/getOverview.service.js \
  src/services/dashboard/helper/getDocStatusOverview.service.js \
  src/services/dashboard/helper/getStatusOverview.service.js \
  src/presenters/dashboard/getOverview.presenter.js
```

- [ ] **Step 3: Remove the empty helper folder**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && rmdir src/services/dashboard/helper
```

Expected: success (no output). If `rmdir` reports "Directory not empty," list the folder with `ls src/services/dashboard/helper/` and remove leftover files manually.

- [ ] **Step 4: Final repo-wide grep**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && grep -rn "dashboard/overview\|GetOverviewService\|GetOverviewPresenter" src
```

Expected: zero matches.

---

## Task 12 — Lint sweep of every touched file

- [ ] **Step 1: Run lint on the full backend**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npm run lint:check
```

Expected: exit 0 with no error output. If there are issues, run `npm run lint` to auto-fix and inspect what changed.

---

## Task 13 — Smoke verification

**Prerequisite:** dev server running (`npm run start:dev`) and a corporate user JWT.

- [ ] **Step 1: `/doc-status-overview` happy path (default month)**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  http://localhost:8004/api/v1/dashboard/doc-status-overview | jq
```

Expected: 200, body shape:
```json
{ "data": { "message": "OK", "data": { "total": <number>, "segments": [ { "status": "received", ... }, ... ] } } }
```

- [ ] **Step 2: `/doc-status-overview` with explicit window**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/dashboard/doc-status-overview?from=2026-05-01&to=2026-05-14" | jq
```

Expected: 200 with same shape; numbers may differ.

- [ ] **Step 3: `/doc-status-overview` invalid date range**

```bash
curl -s -i -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/dashboard/doc-status-overview?from=2026-05-14&to=2026-05-01"
```

Expected: HTTP 400 with `errorCode: "INVALID_DATE_RANGE"` in body.

- [ ] **Step 4: `/kpi-overview` happy path**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  http://localhost:8004/api/v1/dashboard/kpi-overview | jq
```

Expected: 200, body shape:
```json
{ "data": { "message": "OK", "data": { "testCount": <number>, "processingRate": <number>, "pendingAction": <number>, "rejectedRate": { "totalSamples": <number>, "rejectedSamples": <number>, "rejectedRate": <number> }, "testConducted": <number> } } }
```

- [ ] **Step 5: `/kpi-overview` invalid date range**

```bash
curl -s -i -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/dashboard/kpi-overview?from=2026-05-14&to=2026-05-01"
```

Expected: HTTP 400 with `errorCode: "INVALID_DATE_RANGE"`.

- [ ] **Step 6: Old `/overview` route is gone**

```bash
curl -s -i -H "Authorization: Bearer $CORPORATE_TOKEN" \
  http://localhost:8004/api/v1/dashboard/overview
```

Expected: HTTP 404.

- [ ] **Step 7: `/test-category-distribution` regression check**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  http://localhost:8004/api/v1/dashboard/test-category-distribution | jq
```

Expected: 200, same shape as before this PR (availableYears, categories, months, yearTotal).

- [ ] **Step 8: `/corporate/patients` regression check (helper-swap consumer)**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/corporate/patients?limit=5&offset=1" | jq
```

Expected: 200 with `rows[]` and `count` — same shape as before.

- [ ] **Step 9: `/corporate/patients-report` regression check**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/corporate/patients-report?limit=5&offset=1" | jq
```

Expected: 200, prior shape.

- [ ] **Step 10: Verify single-line logs**

Tail the dev-server log during a single request to `/doc-status-overview`. Confirm the following log events each appear as one logical line (`logger.info` call):

1. `ValidateUserHospitalService: Looking up corporate user link`
2. `ValidateUserHospitalService: User row fetched`
3. `GetDocStatusOverviewService: Date window resolved`
4. `GetDocStatusOverviewService: Hospital link confirmed`
5. `GetDocStatusOverviewService: Doc-status repo counts fetched`
6. `GetDocStatusOverviewService: Doc status overview computed`

Expected: all six events visible in order, single-line each.

---

## Task 14 — Commit proposal

- [ ] **Step 1: Run `git status`**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && git status
```

- [ ] **Step 2: Run `git diff` to summarize changes**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && git diff --stat
```

- [ ] **Step 3: Present a grouped commit proposal**

Group the changes into 3 logical commits and write a proposal back to the user (DO NOT run `git commit`). Suggested grouping:

**Commit 1 — `feat(user): add ValidateUserHospitalService helper`**
- `src/services/user/helper/validateUserHospital.service.js` (new)

**Commit 2 — `refactor(corporate): use ValidateUserHospitalService for hospital link checks`**
- `src/services/corporate/getCorporatePatients.service.js`
- `src/services/corporate/getCorporatePatientsReport.service.js`
- `src/services/dashboard/getTestCategoryDistribution.service.js`

**Commit 3 — `feat(dashboard): split /overview into /doc-status-overview and /kpi-overview`**
- `src/services/dashboard/getDocStatusOverview.service.js` (new)
- `src/services/dashboard/getKpiOverview.service.js` (new)
- `src/presenters/dashboard/getDocStatusOverview.presenter.js` (new)
- `src/presenters/dashboard/getKpiOverview.presenter.js` (new)
- `src/rest-resources/controllers/dashboard.controller.js`
- `src/rest-resources/routes/api/v1/dashboard.routes.js`
- `src/libs/permissions.js`
- Deletions: `src/services/dashboard/getOverview.service.js`, `src/services/dashboard/helper/*`, `src/presenters/dashboard/getOverview.presenter.js`

Per saved feedback: omit the `Co-Authored-By` trailer and wait for user authorization before running any `git commit`.
