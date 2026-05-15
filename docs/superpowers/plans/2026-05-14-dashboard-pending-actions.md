# Dashboard Pending Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a corporate dashboard "Pending Actions" surface backed by a new `test_alerts` table — internal writes alert rows during form submit (rejected tests) and during doc-instance release (HIGH RISK in TRISOMY or OTHER CHROMOSOME groups); external exposes a list endpoint and a bulk-acknowledge endpoint, CORPORATE-only.

**Architecture:** One `test_alerts` row per alert event (history preserved). Migration lives in internal (per `feedback_migrations_in_internal.md`); models duplicated in both backends. Service-to-service calls use `.run()` (throws on error); controllers use `.execute()`. Every call boundary inside services/controllers logs its raw return value on a single line.

**Tech Stack:** Node.js, Express, Sequelize, ServiceBase, AJV JSON Schema, `standard` linter. No automated test framework; verification is manual smoke.

**Spec:** `docs/superpowers/specs/2026-05-14-dashboard-pending-actions-design.md`

**Project conventions (saved memory):**

- Service-to-service: `Service.run(args, context)` — throws on `addError`, returns raw `instance.result`.
- Controllers: `Service.execute(args, context, presenter)` + `sendResponse({req,res,next}, {result, successful, serviceErrors: errors})`.
- Repos stay query-only — no `logger.*` inside repos.
- Every `await` to a repo / helper service / utility gets a single-line `logger.info` of the **raw return value** directly under it (no blank line between call and its log). Every value in `context: {...}` is `JSON.stringify(rawValue)` — no `.toISOString()` / `.toString()` first.
- Helper functions live BELOW `export default class` in the same file.
- Migrations only in `fsg_internal_backend`.
- Commits are **proposed at the end**; do NOT run `git commit` between tasks.

---

## File Structure (locked in)

**fsg_internal_backend — new:**
- `src/db/migrations/20260514100000-create-table-test-alerts.js`
- `src/db/models/testAlert.model.js`
- `src/services/testAlert/createRejectedAlertsForTests.service.js`
- `src/services/testAlert/createCriticalAlertIfHighRisk.service.js`
- `src/utils/criticalRiskDetector.utils.js`
- `src/infrastructure/repositories/testAlertRepository.js`

**fsg_internal_backend — modified:**
- `src/libs/constants.js` — add `ALERT_TYPE`
- `src/services/formRequest/submitFormRequest.service.js`
- `src/services/recordManagement/releaseDocument.service.js`

**fsg_client_backend — new:**
- `src/db/models/testAlert.model.js`
- `src/services/dashboard/getPendingActions.service.js`
- `src/services/dashboard/acknowledgeAlerts.service.js`
- `src/presenters/dashboard/getPendingActions.presenter.js`
- `src/presenters/dashboard/acknowledgeAlerts.presenter.js`
- `src/infrastructure/repositories/testAlertRepository.js`

**fsg_client_backend — modified:**
- `src/libs/constants.js`
- `src/libs/permissions.js`
- `src/rest-resources/controllers/dashboard.controller.js`
- `src/rest-resources/routes/api/v1/dashboard.routes.js`

---

## Task 1 — Internal migration: create `test_alerts` table

**Files:**
- Create: `fsg_internal_backend/src/db/migrations/20260514100000-create-table-test-alerts.js`

- [ ] **Step 1: Write the migration file**

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('test_alerts', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      uuid: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      test_result_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      alert_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      acknowledged_by_user_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      download_acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('test_alerts', ['test_result_id', 'alert_type', 'acknowledged_at'], {
      name: 'test_alerts_test_result_id_alert_type_acknowledged_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('test_alerts', 'test_alerts_test_result_id_alert_type_acknowledged_at_idx');
    await queryInterface.dropTable('test_alerts');
  }
};
```

- [ ] **Step 2: Run the migration locally**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npm run migrate
```

Expected: a successful "== 20260514100000-create-table-test-alerts: migrated" line. The table `public.test_alerts` exists with the columns above and the composite index.

---

## Task 2 — Internal model + repository + constant

**Files:**
- Create: `fsg_internal_backend/src/db/models/testAlert.model.js`
- Modify: `fsg_internal_backend/src/libs/constants.js`
- Create: `fsg_internal_backend/src/infrastructure/repositories/testAlertRepository.js`

- [ ] **Step 1: Write the internal Sequelize model**

Create `fsg_internal_backend/src/db/models/testAlert.model.js`:

```js
'use strict'

export default (sequelize, DataTypes) => {
  const TestAlert = sequelize.define('TestAlert', {
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
    alertType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'alert_type'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at'
    },
    acknowledgedByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'acknowledged_by_user_id'
    },
    downloadAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'download_acknowledged_at'
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
    tableName: 'test_alerts',
    schema: 'public',
    timestamps: true
  })

  TestAlert.associate = models => {
    TestAlert.belongsTo(models.TestResult, {
      foreignKey: 'testResultId',
      as: 'testResult'
    })
  }

  return TestAlert
}
```

- [ ] **Step 2: Add the `ALERT_TYPE` constant**

In `fsg_internal_backend/src/libs/constants.js`, locate the `TEST_RESULT_STATUS` export and add immediately below it:

```js
export const ALERT_TYPE = {
  REJECTED: 'rejected',
  CRITICAL: 'critical'
}
```

- [ ] **Step 3: Write the internal repository**

Create `fsg_internal_backend/src/infrastructure/repositories/testAlertRepository.js`:

```js
import db from '../../db/models'

const { TestAlert } = db

export default class TestAlertRepository {
  static async create (row, transaction) {
    return TestAlert.create(row, { transaction })
  }

  static async bulkCreate (rows, transaction) {
    return TestAlert.bulkCreate(rows, { transaction })
  }
}
```

- [ ] **Step 4: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard src/db/models/testAlert.model.js src/libs/constants.js src/infrastructure/repositories/testAlertRepository.js
```

Expected: clean exit. If alignment whitespace is flagged, run `npx standard --fix <files>`.

---

## Task 3 — Critical-risk detector utility

**Files:**
- Create: `fsg_internal_backend/src/utils/criticalRiskDetector.utils.js`

- [ ] **Step 1: Write the helper**

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

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard --fix src/utils/criticalRiskDetector.utils.js
```

Expected: clean exit.

---

## Task 4 — `CreateRejectedAlertsForTestsService`

**Files:**
- Create: `fsg_internal_backend/src/services/testAlert/createRejectedAlertsForTests.service.js`

- [ ] **Step 1: Create the folder if missing**

```bash
mkdir -p /home/kia/Desktop/work/fsg/fsg_internal_backend/src/services/testAlert
```

- [ ] **Step 2: Write the service**

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import { TEST_RESULT_STATUS, ALERT_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    createdTests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          status: { type: 'string' }
        },
        required: ['id', 'status']
      }
    }
  },
  required: ['createdTests']
}

const constraints = ajv.compile(schema)

export default class CreateRejectedAlertsForTestsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, sequelizeTransaction } = this.context
    const { createdTests } = this.args

    const rejectedTests = createdTests.filter(t => t.status === TEST_RESULT_STATUS.REJECTED)
    logger.info('CreateRejectedAlertsForTestsService: ', { message: 'Filtered rejected tests', context: { rejectedTests: JSON.stringify(rejectedTests) } })

    if (rejectedTests.length === 0) return { createdCount: 0 }

    const rows = rejectedTests.map(t => ({ testResultId: t.id, alertType: ALERT_TYPE.REJECTED }))
    const inserted = await TestAlertRepository.bulkCreate(rows, sequelizeTransaction)
    logger.info('CreateRejectedAlertsForTestsService: ', { message: 'Rejected alerts inserted', context: { inserted: JSON.stringify(inserted) } })

    return { createdCount: inserted.length }
  }
}
```

- [ ] **Step 3: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard --fix src/services/testAlert/createRejectedAlertsForTests.service.js
```

Expected: clean exit.

---

## Task 5 — `CreateCriticalAlertIfHighRiskService`

**Files:**
- Create: `fsg_internal_backend/src/services/testAlert/createCriticalAlertIfHighRisk.service.js`

- [ ] **Step 1: Write the service**

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import { ALERT_TYPE } from '../../libs/constants'
import { hasHighRiskResult } from '../../utils/criticalRiskDetector.utils'

const schema = {
  type: 'object',
  properties: {
    docInstance: {
      type: 'object',
      properties: {
        testResultId: { type: 'number' },
        manualFieldValues: { type: ['object', 'null'] }
      },
      required: ['testResultId']
    }
  },
  required: ['docInstance']
}

const constraints = ajv.compile(schema)

export default class CreateCriticalAlertIfHighRiskService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, sequelizeTransaction } = this.context
    const { docInstance } = this.args

    const isCritical = hasHighRiskResult(docInstance.manualFieldValues)
    logger.info('CreateCriticalAlertIfHighRiskService: ', { message: 'Evaluated HIGH RISK presence', context: { isCritical: JSON.stringify(isCritical), testResultId: JSON.stringify(docInstance.testResultId) } })

    if (!isCritical) return { created: false }

    const alert = await TestAlertRepository.create({ testResultId: docInstance.testResultId, alertType: ALERT_TYPE.CRITICAL }, sequelizeTransaction)
    logger.info('CreateCriticalAlertIfHighRiskService: ', { message: 'Critical alert inserted', context: { alert: JSON.stringify(alert) } })

    return { created: true, alert }
  }
}
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard --fix src/services/testAlert/createCriticalAlertIfHighRisk.service.js
```

Expected: clean exit.

---

## Task 6 — Plug `CreateRejectedAlertsForTestsService` into `SubmitFormRequestService`

**Files:**
- Modify: `fsg_internal_backend/src/services/formRequest/submitFormRequest.service.js`

- [ ] **Step 1: Add the import**

Open the file. In the top import block (around line 1-21), add the new import line — place it next to the other `services/...` imports, e.g. right after the `CreateTestsBulkService` import:

```js
import CreateTestsBulkService from '../testResult/createTestsBulk.service'
import CreateRejectedAlertsForTestsService from '../testAlert/createRejectedAlertsForTests.service'
```

- [ ] **Step 2: Call the service after `createdTests` is set**

Locate the line:

```js
createdTests = await CreateTestsBulkService.run({ preparedTests }, this.context)
logger.info('SubmitFormRequestService: ', { message: 'Tests created', context: { createdCount: createdTests.length } })
```

Immediately after the `logger.info` for "Tests created", insert:

```js
const rejectedAlertsResult = await CreateRejectedAlertsForTestsService.run({ createdTests }, this.context)
logger.info('SubmitFormRequestService: ', { message: 'Rejected alerts created', context: { rejectedAlertsResult: JSON.stringify(rejectedAlertsResult) } })
```

- [ ] **Step 3: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard --fix src/services/formRequest/submitFormRequest.service.js
```

Expected: clean exit.

---

## Task 7 — Plug `CreateCriticalAlertIfHighRiskService` into `ReleaseDocumentService`

**Files:**
- Modify: `fsg_internal_backend/src/services/recordManagement/releaseDocument.service.js`

- [ ] **Step 1: Add the import**

At the top of the file, add:

```js
import CreateCriticalAlertIfHighRiskService from '../testAlert/createCriticalAlertIfHighRisk.service'
```

- [ ] **Step 2: Extend the `ValidateDocInstanceByUuidService` attributes request**

Locate:

```js
const docInstance = await ValidateDocInstanceByUuidService.run({ docInstanceUuid, attributes: ['id', 'uuid', 'status', 'autoFieldValues'] }, this.context)
```

Replace with:

```js
const docInstance = await ValidateDocInstanceByUuidService.run({ docInstanceUuid, attributes: ['id', 'uuid', 'status', 'autoFieldValues', 'manualFieldValues', 'testResultId'] }, this.context)
```

- [ ] **Step 3: Insert the critical-alert call after the release update**

Locate the existing block:

```js
await DocInstanceRepository.update(docInstance.id, { status: DOC_INSTANCE_STATUS.RELEASED, approvedBy: adminId, releasedDate: new Date(), autoFieldValues }, sequelizeTransaction)

await pdfGenerationQueue.add(JOB_GENERATE_PREVIEW_PDF, { docInstanceId: docInstance.id })

logger.info('ReleaseDocumentService: ', { message: 'Document released, PDF regenerated', context: { docInstanceUuid: JSON.stringify(docInstanceUuid) } })
```

Replace with:

```js
await DocInstanceRepository.update(docInstance.id, { status: DOC_INSTANCE_STATUS.RELEASED, approvedBy: adminId, releasedDate: new Date(), autoFieldValues }, sequelizeTransaction)
logger.info('ReleaseDocumentService: ', { message: 'Doc instance flipped to released', context: { docInstanceId: JSON.stringify(docInstance.id) } })

const criticalAlertResult = await CreateCriticalAlertIfHighRiskService.run({ docInstance }, this.context)
logger.info('ReleaseDocumentService: ', { message: 'Critical alert check ran', context: { criticalAlertResult: JSON.stringify(criticalAlertResult) } })

await pdfGenerationQueue.add(JOB_GENERATE_PREVIEW_PDF, { docInstanceId: docInstance.id })
logger.info('ReleaseDocumentService: ', { message: 'PDF regeneration job queued', context: { docInstanceUuid: JSON.stringify(docInstanceUuid) } })
```

- [ ] **Step 4: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard --fix src/services/recordManagement/releaseDocument.service.js
```

Expected: clean exit.

---

## Task 8 — External model + constant

**Files:**
- Create: `fsg_client_backend/src/db/models/testAlert.model.js`
- Modify: `fsg_client_backend/src/libs/constants.js`

- [ ] **Step 1: Write the external Sequelize model**

Create `fsg_client_backend/src/db/models/testAlert.model.js`:

```js
'use strict'

export default (sequelize, DataTypes) => {
  const TestAlert = sequelize.define('TestAlert', {
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
    alertType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'alert_type'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at'
    },
    acknowledgedByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'acknowledged_by_user_id'
    },
    downloadAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'download_acknowledged_at'
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
    tableName: 'test_alerts',
    schema: 'public',
    timestamps: true
  })

  TestAlert.associate = models => {
    TestAlert.belongsTo(models.TestResult, {
      foreignKey: 'testResultId',
      as: 'testResult'
    })
  }

  return TestAlert
}
```

- [ ] **Step 2: Add `ALERT_TYPE` to external constants**

In `fsg_client_backend/src/libs/constants.js`, locate `TEST_RESULT_STATUS` and add immediately after it:

```js
export const ALERT_TYPE = {
  REJECTED: 'rejected',
  CRITICAL: 'critical'
}
```

- [ ] **Step 3: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/db/models/testAlert.model.js src/libs/constants.js
```

Expected: clean exit.

---

## Task 9 — External repository

**Files:**
- Create: `fsg_client_backend/src/infrastructure/repositories/testAlertRepository.js`

- [ ] **Step 1: Write the repository**

```js
import db from '../../db/models'

const { TestAlert, TestResult, Patient, TestCategory } = db

export default class TestAlertRepository {
  static async findPendingByHospital (hospitalId, { limit, offset }) {
    return TestAlert.findAndCountAll({
      where: { acknowledgedAt: null },
      include: [{
        model: TestResult,
        as: 'testResult',
        required: true,
        where: { hospitalId },
        attributes: ['id', 'uuid', 'createdAt', 'hospitalId'],
        include: [
          { model: Patient, as: 'patient', attributes: ['firstName', 'lastName'] },
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

  static async findByUuidsScopedToHospital (uuids, hospitalId) {
    return TestAlert.findAll({
      where: { uuid: uuids },
      include: [{
        model: TestResult,
        as: 'testResult',
        required: true,
        where: { hospitalId },
        attributes: ['id', 'hospitalId']
      }],
      raw: true,
      nest: true
    })
  }

  static async bulkAcknowledge (ids, fields) {
    return TestAlert.update(fields, { where: { id: ids } })
  }
}
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/infrastructure/repositories/testAlertRepository.js
```

Expected: clean exit.

---

## Task 10 — `GetPendingActionsService`

**Files:**
- Create: `fsg_client_backend/src/services/dashboard/getPendingActions.service.js`

- [ ] **Step 1: Write the service**

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'

const schema = {
  type: 'object',
  properties: {
    limit: { type: ['number', 'string'], minimum: 1, maximum: 100 },
    offset: { type: ['number', 'string'], minimum: 0 }
  },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetPendingActionsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const limit = Number(this.args.limit) || 20
    const offset = Number(this.args.offset) || 0
    logger.info('GetPendingActionsService: ', { message: 'Listing pending actions for caller hospital', context: { limit: JSON.stringify(limit), offset: JSON.stringify(offset) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetPendingActionsService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const pending = await TestAlertRepository.findPendingByHospital(user.hospitalId, { limit, offset })
    logger.info('GetPendingActionsService: ', { message: 'Pending alerts fetched', context: { pending: JSON.stringify(pending) } })

    const rows = pending.rows.map(mapAlertRowToResponse)
    return { message: 'OK', rows, count: pending.count }
  }
}

const mapAlertRowToResponse = (alert) => ({
  uuid: alert.uuid,
  alertType: alert.alertType,
  relatedTo: `${alert.testResult?.patient?.firstName ?? ''} ${alert.testResult?.patient?.lastName ?? ''}`.trim(),
  testName: alert.testResult?.testCategory?.testName ?? null,
  receivedDate: alert.testResult?.createdAt ?? null,
  raisedOn: alert.createdAt
})
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/services/dashboard/getPendingActions.service.js
```

Expected: clean exit.

---

## Task 11 — `AcknowledgeAlertsService`

**Files:**
- Create: `fsg_client_backend/src/services/dashboard/acknowledgeAlerts.service.js`

- [ ] **Step 1: Write the service**

```js
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'

const schema = {
  type: 'object',
  properties: {
    uuids: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 100 }
  },
  required: ['uuids'],
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class AcknowledgeAlertsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { uuids } = this.args
    logger.info('AcknowledgeAlertsService: ', { message: 'Acknowledging alerts in bulk', context: { uuids: JSON.stringify(uuids) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('AcknowledgeAlertsService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const found = await TestAlertRepository.findByUuidsScopedToHospital(uuids, user.hospitalId)
    logger.info('AcknowledgeAlertsService: ', { message: 'Alerts found for caller hospital', context: { found: JSON.stringify(found) } })

    const toAckIds = found.filter(a => a.acknowledgedAt === null).map(a => a.id)
    logger.info('AcknowledgeAlertsService: ', { message: 'Filtered un-acked alert ids', context: { toAckIds: JSON.stringify(toAckIds) } })

    if (toAckIds.length === 0) return { message: 'OK', acknowledgedCount: 0 }

    const updateResult = await TestAlertRepository.bulkAcknowledge(toAckIds, { acknowledgedAt: new Date(), acknowledgedByUserId: user.id })
    logger.info('AcknowledgeAlertsService: ', { message: 'Bulk acknowledge update result', context: { updateResult: JSON.stringify(updateResult) } })

    return { message: 'OK', acknowledgedCount: toAckIds.length }
  }
}
```

- [ ] **Step 2: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/services/dashboard/acknowledgeAlerts.service.js
```

Expected: clean exit.

---

## Task 12 — Both presenters

**Files:**
- Create: `fsg_client_backend/src/presenters/dashboard/getPendingActions.presenter.js`
- Create: `fsg_client_backend/src/presenters/dashboard/acknowledgeAlerts.presenter.js`

- [ ] **Step 1: Write `getPendingActions.presenter.js`**

```js
class GetPendingActionsPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        rows: data.rows,
        count: data.count
      }
    }
  }
}

export default GetPendingActionsPresenter
```

- [ ] **Step 2: Write `acknowledgeAlerts.presenter.js`**

```js
class AcknowledgeAlertsPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        acknowledgedCount: data.acknowledgedCount
      }
    }
  }
}

export default AcknowledgeAlertsPresenter
```

- [ ] **Step 3: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/presenters/dashboard/getPendingActions.presenter.js src/presenters/dashboard/acknowledgeAlerts.presenter.js
```

Expected: clean exit.

---

## Task 13 — Controller: add `getPendingActions` + `acknowledgeAlerts`

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/controllers/dashboard.controller.js`

- [ ] **Step 1: Add imports**

At the top of the file, after the existing imports, add:

```js
import GetPendingActionsService from '../../services/dashboard/getPendingActions.service'
import AcknowledgeAlertsService from '../../services/dashboard/acknowledgeAlerts.service'
import GetPendingActionsPresenter from '../../presenters/dashboard/getPendingActions.presenter'
import AcknowledgeAlertsPresenter from '../../presenters/dashboard/acknowledgeAlerts.presenter'
```

- [ ] **Step 2: Add two static methods inside the `DashboardController` class**

Append these after the existing `getTestCategoryDistribution` method, before the closing `}` of the class:

```js
  static async getPendingActions (req, res, next) {
    try {
      const { result, successful, errors } = await GetPendingActionsService.execute(req.query, req.context, GetPendingActionsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async acknowledgeAlerts (req, res, next) {
    try {
      const { result, successful, errors } = await AcknowledgeAlertsService.execute(req.body, req.context, AcknowledgeAlertsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
```

- [ ] **Step 3: Lint-check**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/rest-resources/controllers/dashboard.controller.js
```

Expected: clean exit.

---

## Task 14 — Routes + permissions

**Files:**
- Modify: `fsg_client_backend/src/rest-resources/routes/api/v1/dashboard.routes.js`
- Modify: `fsg_client_backend/src/libs/permissions.js`

- [ ] **Step 1: Extend `PERMISSIONS.CORPORATE` to allow POST**

In `src/libs/permissions.js`, locate:

```js
export const PERMISSIONS = {
  CORPORATE: ['R'],
```

Change to:

```js
export const PERMISSIONS = {
  CORPORATE: ['R', 'C'],
```

- [ ] **Step 2: Add the two new aliases**

In the same file, in the `PERMISSION_TYPE.aliases` block (right after the existing `dashboard/kpi-overview` line), add:

```js
    'dashboard/pending-actions':             'CORPORATE',
    'dashboard/pending-actions/acknowledge': 'CORPORATE',
```

(Keep the trailing `'dashboard/test-category-distribution': 'CORPORATE'` line below the new ones.)

- [ ] **Step 3: Add schemas + routes**

In `src/rest-resources/routes/api/v1/dashboard.routes.js`, before the line `const dashboardRoutes = express.Router()`, add two new schema blocks:

```js
const pendingActionsSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit: { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset: { type: ['number', 'string'], minimum: 0 }
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
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  uuid: { type: 'string' },
                  alertType: { type: 'string', enum: ['rejected', 'critical'] },
                  relatedTo: { type: 'string' },
                  testName: { type: ['string', 'null'] },
                  receivedDate: { type: ['string', 'null'] },
                  raisedOn: { type: 'string' }
                },
                required: ['uuid', 'alertType', 'relatedTo', 'testName', 'receivedDate', 'raisedOn']
              }
            },
            count: { type: 'number' }
          },
          required: ['rows', 'count']
        }
      },
      required: ['message', 'data']
    }
  }
}

const acknowledgeAlertsSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      uuids: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 100 }
    },
    required: ['uuids'],
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
            acknowledgedCount: { type: 'number' }
          },
          required: ['acknowledgedCount']
        }
      },
      required: ['message', 'data']
    }
  }
}
```

Then, after the existing `/test-category-distribution` route, append:

```js
dashboardRoutes.route('/pending-actions').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(pendingActionsSchemas),
  DashboardController.getPendingActions,
  responseValidationMiddleware(pendingActionsSchemas)
)

dashboardRoutes.route('/pending-actions/acknowledge').post(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(acknowledgeAlertsSchemas),
  DashboardController.acknowledgeAlerts,
  responseValidationMiddleware(acknowledgeAlertsSchemas)
)
```

- [ ] **Step 4: Lint-check both modified files**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard --fix src/libs/permissions.js src/rest-resources/routes/api/v1/dashboard.routes.js
```

Expected: clean exit.

---

## Task 15 — Lint sweep across files we touched

- [ ] **Step 1: Internal lint check (touched files only)**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && npx standard \
  src/db/migrations/20260514100000-create-table-test-alerts.js \
  src/db/models/testAlert.model.js \
  src/libs/constants.js \
  src/infrastructure/repositories/testAlertRepository.js \
  src/utils/criticalRiskDetector.utils.js \
  src/services/testAlert/createRejectedAlertsForTests.service.js \
  src/services/testAlert/createCriticalAlertIfHighRisk.service.js \
  src/services/formRequest/submitFormRequest.service.js \
  src/services/recordManagement/releaseDocument.service.js
```

Expected: clean exit. If issues remain, run `npx standard --fix <files>` to auto-fix.

- [ ] **Step 2: External lint check (touched files only)**

```bash
cd /home/kia/Desktop/work/fsg/fsg_client_backend && npx standard \
  src/db/models/testAlert.model.js \
  src/libs/constants.js \
  src/libs/permissions.js \
  src/infrastructure/repositories/testAlertRepository.js \
  src/services/dashboard/getPendingActions.service.js \
  src/services/dashboard/acknowledgeAlerts.service.js \
  src/presenters/dashboard/getPendingActions.presenter.js \
  src/presenters/dashboard/acknowledgeAlerts.presenter.js \
  src/rest-resources/controllers/dashboard.controller.js \
  src/rest-resources/routes/api/v1/dashboard.routes.js
```

Expected: clean exit.

---

## Task 16 — Smoke verification (user-driven, both backends running)

**Prerequisites:**
- Internal backend running with the new migration applied.
- External backend running.
- A corporate JWT (`$CORPORATE_TOKEN`) and an internal-admin JWT (`$ADMIN_TOKEN`).

### Internal write paths

- [ ] **Step 1: Submit a form with one rejected test → verify a `rejected` row appears**

```bash
psql "$INTERNAL_DB_URL" -c "SELECT count(*) FROM test_alerts WHERE alert_type='rejected';"
```

Submit a form request that marks one test as `rejected` with a valid `rejectionReasonId`. Re-run the count. Expected: count incremented by exactly 1. Inspect:

```bash
psql "$INTERNAL_DB_URL" -c "SELECT id, uuid, test_result_id, alert_type, acknowledged_at FROM test_alerts ORDER BY id DESC LIMIT 1;"
```

Expected: latest row has `alert_type='rejected'`, `acknowledged_at IS NULL`.

- [ ] **Step 2: Submit a form with all `accepted` tests → no new alert rows**

Compare counts before and after. Expected: unchanged.

- [ ] **Step 3: Release a doc instance with HIGH RISK in trisomy group**

Set up a doc instance whose `manual_field_values` contains:
```json
{ "trisomyScreeningResults": { "trisomy1": "HIGH RISK", "trisomy2": "Low Risk", "trisomy3": "Low Risk", "trisomy4": "Low Risk" } }
```

Move it through preview → review → approval → release via the existing admin flow. Verify:

```bash
psql "$INTERNAL_DB_URL" -c "SELECT id, test_result_id, alert_type, created_at FROM test_alerts WHERE alert_type='critical' ORDER BY id DESC LIMIT 1;"
```

Expected: a fresh `critical` row whose `test_result_id` matches the released doc-instance's `test_result_id`.

- [ ] **Step 4: Release a doc instance with all `Low Risk` values → no critical row**

Same flow, all values `Low Risk`. Compare critical-alert count before/after. Expected: unchanged.

- [ ] **Step 5: Release a doc instance with HIGH RISK in chromosome group**

```json
{ "otherChromosomeScreeningResults": { "chromosome22": "HIGH RISK" } }
```

Expected: one new `critical` row.

### External read/ack

- [ ] **Step 6: `GET /dashboard/pending-actions` happy path**

```bash
curl -s -H "Authorization: Bearer $CORPORATE_TOKEN" \
  "http://localhost:8004/api/v1/dashboard/pending-actions?limit=20&offset=0" | jq
```

Expected: HTTP 200, body:

```json
{
  "data": {
    "message": "OK",
    "data": {
      "rows": [
        { "uuid": "<alert-uuid>", "alertType": "rejected", "relatedTo": "Jane Doe", "testName": "...", "receivedDate": "...", "raisedOn": "..." }
      ],
      "count": <n>
    }
  }
}
```

Rows are scoped to the caller's hospital, ordered by `raisedOn` DESC. Confirm by inspecting `raisedOn` timestamps.

- [ ] **Step 7: `POST /dashboard/pending-actions/acknowledge` happy path**

Pick one uuid from Step 6. Run:

```bash
curl -s -X POST -H "Authorization: Bearer $CORPORATE_TOKEN" -H "Content-Type: application/json" \
  -d '{"uuids": ["<uuid-from-step-6>"]}' \
  http://localhost:8004/api/v1/dashboard/pending-actions/acknowledge | jq
```

Expected: 200, `{ "data": { "message": "OK", "data": { "acknowledgedCount": 1 } } }`.

Verify the row in DB:

```bash
psql "$EXTERNAL_DB_URL" -c "SELECT uuid, acknowledged_at, acknowledged_by_user_id FROM test_alerts WHERE uuid='<uuid>';"
```

Expected: `acknowledged_at` is a recent timestamp, `acknowledged_by_user_id` matches the JWT user id.

- [ ] **Step 8: Re-acknowledge the same uuid → silently skipped**

Re-run the same POST. Expected: 200 with `acknowledgedCount: 0`.

- [ ] **Step 9: Mix of valid + invalid uuids**

```bash
curl -s -X POST -H "Authorization: Bearer $CORPORATE_TOKEN" -H "Content-Type: application/json" \
  -d '{"uuids": ["<valid-uuid>", "00000000-0000-0000-0000-000000000000"]}' \
  http://localhost:8004/api/v1/dashboard/pending-actions/acknowledge | jq
```

Expected: 200 with `acknowledgedCount: 1` (only the valid un-acked uuid is counted).

- [ ] **Step 10: Wrong-hospital uuid → silently skipped**

Pick a pending alert uuid that belongs to a different hospital (have one set up via internal). POST with that uuid. Expected: 200 with `acknowledgedCount: 0`. Verify the row in DB is **not** updated.

- [ ] **Step 11: After ack → uuid no longer returned by GET**

Re-run Step 6's GET. Expected: the acked uuid is absent from the response.

- [ ] **Step 12: Non-corporate user denied**

Use a doctor or patient JWT. Both endpoints should return permission denied. Expected: HTTP 403.

- [ ] **Step 13: Verify single-line logs**

While running steps 6–11, tail the external dev server log. For each request to `/pending-actions`, confirm these events appear in order on single lines:

1. `GetPendingActionsService: Listing pending actions for caller hospital`
2. `ValidateUserHospitalService: Looking up corporate user link`
3. `ValidateUserHospitalService: User row fetched`
4. `GetPendingActionsService: Hospital link confirmed`
5. `GetPendingActionsService: Pending alerts fetched`

For each `/acknowledge` POST, confirm `AcknowledgeAlertsService: ...` log lines for: acknowledging in bulk → hospital confirmed → alerts found → filtered ids → update result.

---

## Task 17 — Commit proposal

- [ ] **Step 1: Run `git status` in both repos**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && git status
cd /home/kia/Desktop/work/fsg/fsg_client_backend && git status
```

- [ ] **Step 2: Run `git diff --stat` in both repos**

```bash
cd /home/kia/Desktop/work/fsg/fsg_internal_backend && git diff --stat
cd /home/kia/Desktop/work/fsg/fsg_client_backend && git diff --stat
```

- [ ] **Step 3: Present the commit grouping to the user (do NOT run `git commit`)**

Suggested grouping (omit the `Co-Authored-By` trailer per saved feedback):

**Internal repo:**

- **Commit I-1 — `feat(testAlert): add test_alerts table, model, and ALERT_TYPE constant`**
  - `src/db/migrations/20260514100000-create-table-test-alerts.js`
  - `src/db/models/testAlert.model.js`
  - `src/libs/constants.js`
  - `src/infrastructure/repositories/testAlertRepository.js`

- **Commit I-2 — `feat(testAlert): create rejected and critical alerts during submit and release`**
  - `src/utils/criticalRiskDetector.utils.js`
  - `src/services/testAlert/createRejectedAlertsForTests.service.js`
  - `src/services/testAlert/createCriticalAlertIfHighRisk.service.js`
  - `src/services/formRequest/submitFormRequest.service.js`
  - `src/services/recordManagement/releaseDocument.service.js`

**External repo:**

- **Commit E-1 — `docs(dashboard): spec + plan for pending-actions feature`**
  - `docs/superpowers/specs/2026-05-14-dashboard-pending-actions-design.md`
  - `docs/superpowers/plans/2026-05-14-dashboard-pending-actions.md`

- **Commit E-2 — `feat(dashboard): pending-actions list + bulk acknowledge endpoints`**
  - `src/db/models/testAlert.model.js`
  - `src/libs/constants.js`
  - `src/libs/permissions.js`
  - `src/infrastructure/repositories/testAlertRepository.js`
  - `src/services/dashboard/getPendingActions.service.js`
  - `src/services/dashboard/acknowledgeAlerts.service.js`
  - `src/presenters/dashboard/getPendingActions.presenter.js`
  - `src/presenters/dashboard/acknowledgeAlerts.presenter.js`
  - `src/rest-resources/controllers/dashboard.controller.js`
  - `src/rest-resources/routes/api/v1/dashboard.routes.js`

Wait for user authorization before running any `git commit`.
