import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TEST_RESULT_STATUS, LAB_STATUS, DOC_INSTANCE_STATUS, ACCOUNT_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    limit:          { type: 'number', minimum: 1, maximum: 100 },
    offset:         { type: 'number', minimum: 0 },
    orderBy:        { type: 'string' },
    orderDirection: { type: 'string', enum: ['ASC', 'DESC'] }
  }
}

const constraints = ajv.compile(schema)

export default class GetDoctorPatientsReportService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { limit, offset, orderBy, orderDirection } = this.args

    logger.info('GetDoctorPatientsReportService: ', { message: 'Listing all completed/released tests for all patients of caller doctor', context: { userId: JSON.stringify(userId), args: JSON.stringify(this.args) } })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.DOCTOR, { attributes: ['doctorId'] })
    if (!owner?.doctorId) return this.addError('AccountNotLinkedErrorType')

    const rows = await TestResultRepository.findCompletedReleasedByDoctorId(owner.doctorId, {
      status:            TEST_RESULT_STATUS.COMPLETED,
      labStatus:         LAB_STATUS.RECORD_MANAGEMENT,
      docInstanceStatus: DOC_INSTANCE_STATUS.RELEASED,
      limit, offset, orderBy, orderDirection
    })

    logger.info('GetDoctorPatientsReportService: ', { message: 'Doctor patients report returned', context: { count: JSON.stringify(rows.length) } })

    return { message: 'OK', rows, count: rows.length }
  }
}
