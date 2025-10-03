import ITestResultRepository from '../../domain/repositories/ITestResultRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class TestResultRepository extends ITestResultRepository {
  static async findById (id, options = {}) {
    const { TestResult: TestResultModel } = models

    const {
      attributes = ['id', 'uuid'],
    } = options

    return await TestResultModel.findByPk(id, { attributes, raw: true })
  }

  static async findAllByUserIdWithSearch (userId, options = {}) {
    const { TestResult: TestResultModel } = models

    const whereClause = { userId }

    const {
      attributes = ['id'],
      offset = 1,
      limit = 10,
      orderBy = [['createdAt', 'ASC']],
      searchTerm = null
    } = options

    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { errorMessage: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    }

    const { count, rows } = await TestResultModel.findAndCountAll({
      where: whereClause,
      attributes,
      limit,
      offset,
      order: orderBy,
      raw: true
    })

    return { count, rows }
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
