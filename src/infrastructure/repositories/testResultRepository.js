import ITestResultRepository from '../../domain/repositories/ITestResultRepository'
import models, { sequelize } from '../../db/models'
import Sequelize, { Op, QueryTypes } from 'sequelize'
import { TEST_RESULT_STATUS, LAB_STATUS, DOC_TEMPLATE_TYPE } from '../../libs/constants'

export default class TestResultRepository extends ITestResultRepository {
  static async findById (id, options = {}) {
    const { TestResult: TestResultModel } = models
    const { attributes = ['id', 'uuid'] } = options

    return await TestResultModel.findByPk(id, { attributes, raw: true })
  }

  /**
   * Distinct patients linked to the actor's owner column.
   * Used by getMyPatients (corporate / doctor).
   */
  static async findDistinctPatientsByOwner (ownerColumn, ownerValue, options = {}) {
    const { TestResult: TestResultModel, Patient: PatientModel, User: UserModel } = models
    const {
      limit = 10,
      offset = 0,
      search,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = options

    const where = { [ownerColumn]: ownerValue }
    const patientWhere = {}
    if (search) {
      patientWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } }
      ]
    }

    return await TestResultModel.findAll({
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
      order: [[{ model: PatientModel, as: 'patient' }, orderBy, orderDirection]],
      raw: true,
      nest: true
    })
  }

  /**
   * Completed + released tests for ALL patients linked to a hospital.
   * Used by getCorporatePatientsReport.
   */
  static async findCompletedReleasedByHospitalId (hospitalId, options = {}) {
    const { TestResult: TestResultModel, Patient: PatientModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel } = models
    const {
      status,
      labStatus,
      docInstanceStatus,
      visitDateFrom,
      visitDateTo,
      patientName,
      patientId,
      limit = 10,
      offset = 0,
      orderBy = 'releasedDate',
      orderDirection = 'DESC'
    } = options

    const where = { hospitalId, status, labStatus }
    if (visitDateFrom || visitDateTo) {
      where.createdAt = {}
      if (visitDateFrom) where.createdAt[Op.gte] = new Date(visitDateFrom)
      if (visitDateTo)   where.createdAt[Op.lte] = new Date(`${visitDateTo}T23:59:59.999Z`)
    }

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

    const rows = await TestResultModel.findAll({
      where,
      attributes: ['uuid', 'createdAt'],
      include: [
        {
          model: PatientModel,
          as: 'patient',
          required: true,
          where: patientWhere,
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
          where: { status: docInstanceStatus },
          attributes: ['uuid', 'releasedDate']
        }
      ],
      order: [[{ model: DocInstanceModel, as: 'docInstances' }, orderBy, orderDirection]],
      limit,
      offset,
      subQuery: false
    })

    return rows.map(row => row.toJSON())
  }

  /**
   * Completed + released tests for ALL patients linked to a doctor.
   * Used by getDoctorPatientsReport.
   */
  static async findCompletedReleasedByDoctorId (doctorId, options = {}) {
    const { TestResult: TestResultModel, Patient: PatientModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel } = models
    const {
      status,
      labStatus,
      docInstanceStatus,
      visitDateFrom,
      visitDateTo,
      patientName,
      patientId,
      limit = 10,
      offset = 0,
      orderBy = 'releasedDate',
      orderDirection = 'DESC'
    } = options

    const where = { doctorId, status, labStatus }
    if (visitDateFrom || visitDateTo) {
      where.createdAt = {}
      if (visitDateFrom) where.createdAt[Op.gte] = new Date(visitDateFrom)
      if (visitDateTo)   where.createdAt[Op.lte] = new Date(`${visitDateTo}T23:59:59.999Z`)
    }

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

    const rows = await TestResultModel.findAll({
      where,
      attributes: ['uuid', 'createdAt'],
      include: [
        {
          model: PatientModel,
          as: 'patient',
          required: true,
          where: patientWhere,
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
          where: { status: docInstanceStatus },
          attributes: ['uuid', 'releasedDate']
        }
      ],
      order: [[{ model: DocInstanceModel, as: 'docInstances' }, orderBy, orderDirection]],
      limit,
      offset,
      subQuery: false
    })

    return rows.map(row => row.toJSON())
  }

  /**
   * All tests for a patient, regardless of doc instance status.
   * Used by getMyReportStatus (patient self-view).
   */
  static async findAllForPatient (patientId, docTemplateType, options = {}) {
    const { TestResult: TestResultModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel, DocTemplate: DocTemplateModel } = models
    const {
      limit = 10,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = options

    return await TestResultModel.findAll({
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
          attributes: ['uuid', 'status'],
          required: false,
          include: [
            {
              model: DocTemplateModel,
              as: 'docTemplate',
              attributes: [],
              where: { type: docTemplateType },
              required: true
            }
          ]
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true
    })
  }

  static async create (createObject, transaction) {
    const { TestResult: TestResultModel } = models

    return await TestResultModel.create(createObject, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { TestResult: TestResultModel } = models

    return TestResultModel.update(updateObject, { where: { id }, transaction })
  }

  static async countByHospital (hospitalId, { from, to }) {
    const { TestResult: TestResultModel } = models

    return TestResultModel.count({
      where: {
        hospitalId,
        createdAt: { [Op.between]: [from, to] }
      }
    })
  }

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
}
