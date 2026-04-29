import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { ACCOUNT_TYPE } from '../../libs/constants'

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

export default class GetMyReportStatusService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { limit, offset, orderBy, orderDirection } = this.args

    logger.info('GetMyReportStatusService: ', { message: 'Listing all tests for the authenticated patient', context: { userId: JSON.stringify(userId), args: JSON.stringify(this.args) } })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.PATIENT, { attributes: ['patientId'] })
    if (!owner?.patientId) return this.addError('AccountNotLinkedErrorType')

    const rows = await TestResultRepository.findAllForPatient(owner.patientId, { limit, offset, orderBy, orderDirection })

    logger.info('GetMyReportStatusService: ', { message: 'Report status list returned', context: { count: JSON.stringify(rows.length) } })

    return { message: 'OK', rows, count: rows.length }
  }
}
