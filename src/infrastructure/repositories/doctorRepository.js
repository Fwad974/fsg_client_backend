import models from '../../db/models'
import IDoctorRepository from '../../domain/repositories/IDoctorRepository'
import { Op } from 'sequelize'

export default class DoctorRepository extends IDoctorRepository {
  static async findById (id, options = {}) {
    const { Doctor: DoctorModel } = models
    const { transaction } = options

    return await DoctorModel.findByPk(id, { transaction, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { Doctor: DoctorModel } = models
    const { transaction } = options

    return await DoctorModel.findOne({
      where: { userId },
      transaction,
      raw: true
    })
  }

  static async create (doctor, transaction) {
    const { Doctor: DoctorModel } = models

    return await DoctorModel.create(doctor, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { Doctor: DoctorModel } = models

    return await DoctorModel.update(updateObject, {
      where: { id },
      transaction
    })
  }

  static async findPatientsByDoctorId (doctorId, options = {}) {
    const { Individual: IndividualModel, User: UserModel } = models
    const { transaction, limit = 10, offset = 0, searchTerm } = options

    const whereClause = {}

    // Add search functionality if searchTerm is provided
    if (searchTerm) {
      whereClause['$user.firstName$'] = {
        [Op.iLike]: `%${searchTerm}%`
      }
    }

    const { count, rows } = await IndividualModel.findAndCountAll({
      include: [{
        model: models.Doctor,
        as: 'doctors',
        where: { id: doctorId },
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

  static async findPatientsTestResultsByDoctorId (doctorId, options = {}) {
    const { TestResult: TestResultModel, Individual: IndividualModel, User: UserModel } = models
    const { transaction, limit = 10, offset = 0, searchTerm } = options

    const whereClause = { doctorId }

    // Add search functionality if searchTerm is provided
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
        include: [{
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
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
