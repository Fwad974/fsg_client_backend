import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import TestResultRepository from '../../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../../infrastructure/repositories/docInstanceRepository'
import SampleRepository from '../../../infrastructure/repositories/sampleRepository'
import { percentage } from '../../../utils/percentage.utils'

const schema = {
  type: 'object',
  properties: {
    hospitalId: { type: ['number', 'string'] },
    from:       {},
    to:         {}
  },
  required: ['hospitalId', 'from', 'to']
}

const constraints = ajv.compile(schema)

export default class GetStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { hospitalId, from, to } = this.args

    const [testCount, statusCounts, totalSamples, rejectedSamples] = await Promise.all([
      TestResultRepository.countByHospital(hospitalId, { from, to }),
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      SampleRepository.countByHospital(hospitalId, { from, to }),
      SampleRepository.countRejectedByHospital(hospitalId, { from, to })
    ])

    const released        = statusCounts.released        || 0
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0

    return {
      testCount,
      processingRate: percentage(released, testCount),
      pendingAction:  pendingReview + pendingApproval,
      rejectedRate: {
        totalSamples,
        rejectedSamples,
        rejectedRate: percentage(rejectedSamples, totalSamples)
      },
      testConducted: released
    }
  }
}
