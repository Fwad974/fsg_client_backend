import ITestCategoryRepository from '../../domain/repositories/ITestCategoryRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class TestCategoryRepository extends ITestCategoryRepository {
  static async findAndCountAll (options = {}) {
    const { TestCategory: TestCategoryModel } = models
    const {
      transaction,
      search,
      limit = 10,
      offset = 0,
      orderBy = 'id',
      orderDirection = 'ASC',
      attributes = ['id', 'testCode', 'testName', 'description', 'serviceCategory', 'tat', 'testCategory']
    } = options

    const whereClause = {}
    if (search) {
      whereClause[Op.or] = [
        { testCode: { [Op.iLike]: `%${search}%` } },
        { testName: { [Op.iLike]: `%${search}%` } }
      ]
    }

    return await TestCategoryModel.findAndCountAll({
      where: whereClause,
      attributes,
      limit,
      offset,
      order: [[orderBy, orderDirection]],
      transaction,
      raw: true
    })
  }

  static async findById (id, options = {}) {
    const { TestCategory: TestCategoryModel } = models
    const { transaction } = options

    return await TestCategoryModel.findByPk(id, {
      transaction,
      raw: true
    })
  }

  static async findByTestCode (testCode, options = {}) {
    const { TestCategory: TestCategoryModel } = models
    const { transaction } = options

    return await TestCategoryModel.findOne({
      where: { testCode },
      transaction,
      raw: true
    })
  }
}
