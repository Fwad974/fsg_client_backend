import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
import { resolveWindow } from '../../utils/dashboardDateWindow.utils'
import { percentage } from '../../utils/percentage.utils'

const schema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' }
  },
  dependencies: { from: ['to'], to: ['from'] },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetDocStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { from, to } = resolveWindow(this.args)
    logger.info('GetDocStatusOverviewService: ', { message: 'Date window resolved', context: { from: JSON.stringify(from), to: JSON.stringify(to) } })

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetDocStatusOverviewService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const { hospitalId } = user

    const [statusCounts, missing] = await Promise.all([
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      TestResultRepository.countCompletedRecordMgmtMissingDocInstance(hospitalId, { from, to })
    ])
    logger.info('GetDocStatusOverviewService: ', { message: 'Doc-status repo counts fetched', context: { statusCounts: JSON.stringify(statusCounts), missing: JSON.stringify(missing) } })

    const received = (statusCounts.reserved || 0) +
                          (statusCounts.pendingAnalysis || 0) +
                          (statusCounts.pendingPreview || 0) +
                          missing
    const pendingReview = statusCounts.pendingReview || 0
    const pendingApproval = statusCounts.pendingApproval || 0
    const released = statusCounts.released || 0

    const total = received + pendingReview + pendingApproval + released

    const result = {
      message: 'OK',
      total,
      segments: [
        { status: 'received', count: received, percentage: percentage(received, total) },
        { status: 'pending-review', count: pendingReview, percentage: percentage(pendingReview, total) },
        { status: 'pending-approval', count: pendingApproval, percentage: percentage(pendingApproval, total) },
        { status: 'released', count: released, percentage: percentage(released, total) }
      ]
    }
    logger.info('GetDocStatusOverviewService: ', { message: 'Doc status overview computed', context: { result: JSON.stringify(result) } })

    return result
  }
}
