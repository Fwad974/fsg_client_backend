import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import UserRepository from '../../infrastructure/repositories/userRepository'
import GetDocStatusOverviewService from './helper/getDocStatusOverview.service'
import GetStatusOverviewService from './helper/getStatusOverview.service'
import { ACCOUNT_TYPE } from '../../libs/constants'
import { resolveWindow } from '../../utils/dashboardDateWindow.utils'

const schema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to:   { type: 'string', format: 'date' }
  },
  dependencies: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { from, to } = resolveWindow(this.args)

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    logger.info('GetOverviewService: ', {
      message: 'Building corporate dashboard overview',
      context: { userId: JSON.stringify(userId), from: from.toISOString(), to: to.toISOString() }
    })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const workerArgs = { hospitalId: owner.hospitalId, from, to }
    const [docStatusInstance, statusInstance] = await Promise.all([
      GetDocStatusOverviewService.execute(workerArgs, this.context),
      GetStatusOverviewService.execute(workerArgs, this.context)
    ])

    if (!docStatusInstance.successful) { this.mergeErrors(docStatusInstance.errors); return }
    if (!statusInstance.successful)    { this.mergeErrors(statusInstance.errors); return }

    return {
      message: 'OK',
      docStatusOverview: docStatusInstance.result,
      statusOverview:    statusInstance.result
    }
  }
}
