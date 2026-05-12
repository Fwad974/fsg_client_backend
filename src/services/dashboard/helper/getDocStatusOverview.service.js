import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import TestResultRepository from '../../../infrastructure/repositories/testResultRepository'
import DocInstanceRepository from '../../../infrastructure/repositories/docInstanceRepository'
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

export default class GetDocStatusOverviewService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { hospitalId, from, to } = this.args

    const [statusCounts, missing] = await Promise.all([
      DocInstanceRepository.countByStatusForHospitalRecordMgmt(hospitalId, { from, to }),
      TestResultRepository.countCompletedRecordMgmtMissingDocInstance(hospitalId, { from, to })
    ])

    const received        = (statusCounts.reserved        || 0)
                          + (statusCounts.pendingAnalysis || 0)
                          + (statusCounts.pendingPreview  || 0)
                          + missing
    const pendingReview   = statusCounts.pendingReview   || 0
    const pendingApproval = statusCounts.pendingApproval || 0
    const released        = statusCounts.released        || 0

    const total = received + pendingReview + pendingApproval + released

    return {
      total,
      segments: [
        { status: 'received',         count: received,        percentage: percentage(received,        total) },
        { status: 'pending-review',   count: pendingReview,   percentage: percentage(pendingReview,   total) },
        { status: 'pending-approval', count: pendingApproval, percentage: percentage(pendingApproval, total) },
        { status: 'released',         count: released,        percentage: percentage(released,        total) }
      ]
    }
  }
}
