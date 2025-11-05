import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestCategoryRepository from '../../infrastructure/repositories/testCategoryRepository'

const schema = {
  type: 'object',
  properties: {
    search: { type: 'string' },
    limit: { type: 'number', minimum: 1, maximum: 100 },
    offset: { type: 'number', minimum: 0 }
  }
}

const constraints = ajv.compile(schema)

export default class GetAllTestCategoriesService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const { logger } = this.context
    const { search, limit, offset } = this.args

    logger.info('GetAllTestCategoriesService', {
      message: 'Fetching test categories',
      context: { args: JSON.stringify(this.args) }
    })

    const { count, rows } = await TestCategoryRepository.findAndCountAll({
      search,
      limit,
      offset
    })

    logger.info('GetAllTestCategoriesService', {
      message: 'Test categories fetched successfully',
      context: {
        count: JSON.stringify(rows.length),
        total: JSON.stringify(count)
      }
    })

    return {
      message: 'Test categories retrieved successfully',
      rows,
      count
    }
  }
}
