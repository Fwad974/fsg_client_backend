import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import SampleRepository from '../../infrastructure/repositories/sampleRepository'
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

export default class GetKpiOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { from, to } = resolveWindow(this.args)
    logger.info('GetKpiOverviewService: ', { message: 'Date window resolved', context: { from: JSON.stringify(from), to: JSON.stringify(to) } })

    if (from > to) return this.addError('InvalidDateRangeErrorType')

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetKpiOverviewService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const { hospitalId } = user

    const [testCount, statusCounts, totalSamples, rejectedSamples] = await Promise.all([
      TestResultRepository.countByHospital(hospitalId, { from, to }),
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      SampleRepository.countByHospital(hospitalId, { from, to }),
      SampleRepository.countRejectedByHospital(hospitalId, { from, to })
    ])
    logger.info('GetKpiOverviewService: ', { message: 'KPI repo counts fetched', context: { testCount: JSON.stringify(testCount), statusCounts: JSON.stringify(statusCounts), totalSamples: JSON.stringify(totalSamples), rejectedSamples: JSON.stringify(rejectedSamples) } })

    const released = statusCounts.released || 0
    const pendingReview = statusCounts.pendingReview || 0
    const pendingApproval = statusCounts.pendingApproval || 0

    const result = {
      message: 'OK',
      testCount,
      processingRate: percentage(released, testCount),
      pendingAction: pendingReview + pendingApproval,
      rejectedRate: {
        totalSamples,
        rejectedSamples,
        rejectedRate: percentage(rejectedSamples, totalSamples)
      },
      testConducted: released
    }
    logger.info('GetKpiOverviewService: ', { message: 'KPI overview computed', context: { result: JSON.stringify(result) } })

    return result
  }
}
