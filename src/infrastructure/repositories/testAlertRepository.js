import db from '../../db/models'
import { ALERT_TYPE } from '../../libs/constants'

const { TestAlert, TestResult, Patient, TestCategory } = db

export default class TestAlertRepository {
  static async findNotAcknowledgedByHospitalId (hospitalId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      order = [['createdAt', 'DESC']],
      attributes = ['id', 'uuid', 'alertType', 'createdAt']
    } = options
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
      order,
      limit,
      offset,
      attributes,
      raw: true,
      nest: true
    })
  }

  static async findNotAcknowledgedByUuidsAndHospitalId (uuids, hospitalId, options = {}) {
    const {
      limit = uuids.length,
      offset = 0,
      order = [['createdAt', 'DESC']],
      attributes = ['id']
    } = options
    return TestAlert.findAll({
      where: { uuid: uuids, acknowledgedAt: null },
      include: [{
        model: TestResult,
        as: 'testResult',
        required: true,
        where: { hospitalId },
        attributes: ['id', 'hospitalId']
      }],
      order,
      limit,
      offset,
      attributes,
      raw: true,
      nest: true
    })
  }

  static async findCriticalReportsNotDownloadAckedByUuidsAndHospitalId (uuids, hospitalId, options = {}) {
    const {
      limit = uuids.length,
      offset = 0,
      order = [['createdAt', 'DESC']],
      attributes = ['id']
    } = options
    return TestAlert.findAll({
      where: { uuid: uuids, alertType: ALERT_TYPE.CRITICAL_REPORT, downloadAcknowledgedAt: null },
      include: [{
        model: TestResult,
        as: 'testResult',
        required: true,
        where: { hospitalId },
        attributes: ['id', 'hospitalId']
      }],
      order,
      limit,
      offset,
      attributes,
      raw: true,
      nest: true
    })
  }

  static async update (ids, fields) {
    return TestAlert.update(fields, { where: { id: ids } })
  }
}
