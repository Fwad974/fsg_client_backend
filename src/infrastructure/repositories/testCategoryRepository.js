import ITestCategoryRepository from '../../domain/repositories/ITestCategoryRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class TestCategoryRepository extends ITestCategoryRepository {
  static async findAndCountAll (options = {}) {
    const { TestCategory: TestCategoryModel } = models
    const {
      transaction,
      search,
      limit,
      offset,
      attributes = ['id', 'testCode', 'testName', 'description', 'serviceCategory', 'tat', 'testCategory']
    } = options

    const whereClause = {}

    if (search) {
      whereClause[Op.or] = [
        { testCode: { [Op.iLike]: `%${search}%` } },
        { testName: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const queryOptions = {
      where: whereClause,
      attributes,
      transaction,
      raw: true,
      nest: true
    }

    // Only add limit and offset if provided
    if (limit !== undefined && limit !== null) {
      queryOptions.limit = limit
    }

    if (offset !== undefined && offset !== null) {
      queryOptions.offset = offset
    }

    return await TestCategoryModel.findAndCountAll(queryOptions)
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
