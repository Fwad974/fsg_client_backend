import models from '../../db/models'
import ICorporateRepository from '../../domain/repositories/ICorporateRepository'
import { Op } from 'sequelize'

export default class CorporateRepository extends ICorporateRepository {
  static async findById (id, options = {}) {
    const { Corporate: CorporateModel } = models
    const { transaction } = options

    return await CorporateModel.findByPk(id, { transaction, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { Corporate: CorporateModel } = models
    const { transaction } = options

    return await CorporateModel.findOne({
      where: { userId },
      transaction,
      raw: true
    })
  }

  static async create (corporate, transaction) {
    const { Corporate: CorporateModel } = models

    return await CorporateModel.create(corporate, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { Corporate: CorporateModel } = models

    return await CorporateModel.update(updateObject, {
      where: { id },
      transaction
    })
  }

  // TODO: need to use coporate model and join IndividualModel and the search be on IndividualModel name or coporate compony name
  static async findPatientsByCorporateId (corporateId, options = {}) {
    const { Individual: IndividualModel, User: UserModel } = models
    const { transaction, limit = 10, offset = 0, searchTerm } = options

    const whereClause = {}

    if (searchTerm) {
      whereClause['$user.firstName$'] = {
        [Op.iLike]: `%${searchTerm}%`
      }
    }

    const { count, rows } = await IndividualModel.findAndCountAll({
      include: [{
        model: models.Corporate,
        as: 'corporates',
        where: { id: corporateId },
        attributes: [],
        through: { attributes: [] }
      }, {
        model: UserModel,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }],
      where: whereClause,
      limit,
      offset: Math.max(0, offset - 1),
      order: [['createdAt', 'DESC']],
      transaction
    })

    return { count, rows }
  }

  static async findDoctorsByCorporateId (corporateId, options = {}) {
    const { Doctor: DoctorModel, User: UserModel } = models
    const { transaction, limit = 10, offset = 0, searchTerm } = options

    const whereClause = {}

    if (searchTerm) {
      whereClause['$user.firstName$'] = {
        [Op.iLike]: `%${searchTerm}%`
      }
    }

    // TODO: need to use coporate model and join doctor and the search be on doctor cilinc name or coporate compony name
    const { count, rows } = await DoctorModel.findAndCountAll({
      include: [{
        model: models.Corporate,
        as: 'corporates',
        where: { id: corporateId },
        attributes: [],
        through: { attributes: [] }
      }, {
        model: UserModel,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }],
      where: whereClause,
      limit,
      offset: Math.max(0, offset - 1),
      order: [['createdAt', 'DESC']],
      transaction
    })

    return { count, rows }
  }

  // TODO: need to change this to test resukt repo and join it with corporate
  static async findPatientsTestResultsByCorporateId (corporateId, options = {}) {
    const { TestResult: TestResultModel, Individual: IndividualModel, User: UserModel } = models
    const {
      transaction,
      limit = 10,
      offset = 0,
      searchTerm,
      attributes = ['id', 'userId', 'dateOfBirth', 'gender', 'nationality', 'diagnosis', 'address'],
      userAttributes = ['id', 'firstName', 'lastName', 'email', 'phone']
    } = options

    const whereClause = { corporateId }

    if (searchTerm) {
      whereClause.name = {
        [Op.iLike]: `%${searchTerm}%`
      }
    }

    const { count, rows } = await TestResultModel.findAndCountAll({
      where: whereClause,
      include: [{
        model: IndividualModel,
        as: 'individual',
        attributes,
        include: [{
          model: UserModel,
          as: 'user',
          attributes: userAttributes
        }]
      }],
      limit,
      offset: Math.max(0, offset - 1),
      order: [['createdAt', 'DESC']],
      transaction
    })

    return { count, rows }
  }

  static async getCorporatePatients (corporateId, options = {}) {
    const { Corporate: CorporateModel, Individual: IndividualModel, User: UserModel } = models
    const { transaction, limit, offset, searchTerm } = options

    const whereClause = { id: corporateId }

    if (searchTerm) {
      whereClause[Op.or] = [
        { '$individuals.user.userName$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$individuals.user.email$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$individuals.user.phone$': { [Op.iLike]: `%${searchTerm}%` } }
      ]
    }

    const { count, rows } = await CorporateModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: IndividualModel,
          as: 'individuals',
          attributes: ['id'],
          through: { attributes: [] },
          include: [
            {
              model: UserModel,
              as: 'user',
              attributes: ['userName', 'uuid', 'email', 'phone']
            }
          ]
        }
      ],
      attributes: [],
      limit,
      offset,
      transaction
    })

    return { count, rows }
  }

  static async getCorporateTestResults (corporateId, options = {}) {
    const { Corporate: CorporateModel, TestResult: TestResultModel, Individual: IndividualModel, User: UserModel } = models
    const { transaction, limit, offset, searchTerm } = options

    const whereClause = { id: corporateId }

    if (searchTerm) {
      whereClause[Op.or] = [
        { '$testResults.name$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$testResults.individual.user.userName$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$testResults.individual.user.email$': { [Op.iLike]: `%${searchTerm}%` } }
      ]
    }

    const { count, rows } = await CorporateModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TestResultModel,
          as: 'testResults',
          attributes: ['id', 'name', 'status', 'sample', 'duration', 'errorMessage', 'errorType', 'startTime', 'endTime', 'fileUuid', 'fileName', 'createdAt'],
          include: [
            {
              model: IndividualModel,
              as: 'individual',
              attributes: ['id'],
              include: [
                {
                  model: UserModel,
                  as: 'user',
                  attributes: ['userName', 'uuid', 'email', 'phone']
                }
              ]
            }
          ]
        }
      ],
      attributes: [],
      limit,
      offset,
      order: [[{ model: TestResultModel, as: 'testResults' }, 'createdAt', 'DESC']],
      transaction
    })

    return { count, rows }
  }
}
