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
}
