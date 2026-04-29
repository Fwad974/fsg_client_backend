import ITestResultRepository from '../../domain/repositories/ITestResultRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

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
      limit = 10,
      offset = 0,
      orderBy = 'releasedDate',
      orderDirection = 'DESC'
    } = options

    const rows = await TestResultModel.findAll({
      where: { hospitalId, status, labStatus },
      attributes: ['uuid', 'createdAt'],
      include: [
        {
          model: PatientModel,
          as: 'patient',
          required: true,
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
      limit = 10,
      offset = 0,
      orderBy = 'releasedDate',
      orderDirection = 'DESC'
    } = options

    const rows = await TestResultModel.findAll({
      where: { doctorId, status, labStatus },
      attributes: ['uuid', 'createdAt'],
      include: [
        {
          model: PatientModel,
          as: 'patient',
          required: true,
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
  static async findAllForPatient (patientId, options = {}) {
    const { TestResult: TestResultModel, TestCategory: TestCategoryModel, DocInstance: DocInstanceModel } = models
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
          attributes: ['uuid'],
          required: false
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
}
