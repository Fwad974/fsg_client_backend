import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestCategoryRepository from '../../infrastructure/repositories/testCategoryRepository'

const schema = {
  type: 'object',
  properties: {
    search:         { type: 'string' },
    limit:          { type: 'number', minimum: 1, maximum: 100 },
    offset:         { type: 'number', minimum: 0 },
    orderBy:        { type: 'string' },
    orderDirection: { type: 'string', enum: ['ASC', 'DESC'] }
  }
}

const constraints = ajv.compile(schema)

export default class GetTestCatalogService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { search, limit, offset, orderBy, orderDirection } = this.args

    logger.info('GetTestCatalogService: ', { message: 'Fetching orderable test catalog', context: { args: JSON.stringify(this.args) } })

    const { rows, count } = await TestCategoryRepository.findAndCountAll({ search, limit, offset, orderBy, orderDirection, attributes: ['testName', 'testCode', 'tat'] })

    logger.info('GetTestCatalogService: ', { message: 'Test catalog returned', context: { count: JSON.stringify(count) } })

    return { message: 'OK', rows, count }
  }
}
