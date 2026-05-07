import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TEST_RESULT_STATUS, LAB_STATUS, DOC_INSTANCE_STATUS, ACCOUNT_TYPE } from '../../libs/constants'
import { resolveVisitDateRange } from '../../utils/dateRange.utils'

const schema = {
  type: 'object',
  properties: {
    limit:             { type: 'number', minimum: 1, maximum: 100 },
    offset:            { type: 'number', minimum: 0 },
    orderBy:           { type: 'string' },
    orderDirection:    { type: 'string', enum: ['ASC', 'DESC'] },
    visitDateFrom:     { type: 'string', format: 'date' },
    visitDateTo:       { type: 'string', format: 'date' },
    reportingDateFrom: { type: 'string', format: 'date' },
    reportingDateTo:   { type: 'string', format: 'date' },
    patientName:       { type: 'string', minLength: 1 },
    patientId:         { type: 'string', minLength: 1 }
  }
}

const constraints = ajv.compile(schema)

export default class GetCorporatePatientsReportService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { limit, offset, orderBy, orderDirection,
            visitDateFrom, visitDateTo,
            reportingDateFrom, reportingDateTo,
            patientName, patientId } = this.args

    const { from: effectiveVisitDateFrom, to: effectiveVisitDateTo } =
      resolveVisitDateRange({ visitDateFrom, visitDateTo, reportingDateFrom, reportingDateTo })

    logger.info('GetCorporatePatientsReportService: ', { message: 'Listing all completed/released tests for all patients of caller hospital', context: { userId: JSON.stringify(userId), args: JSON.stringify(this.args) } })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const rows = await TestResultRepository.findCompletedReleasedByHospitalId(owner.hospitalId, {
      status:            TEST_RESULT_STATUS.COMPLETED,
      labStatus:         LAB_STATUS.RECORD_MANAGEMENT,
      docInstanceStatus: DOC_INSTANCE_STATUS.RELEASED,
      limit, offset, orderBy, orderDirection,
      visitDateFrom: effectiveVisitDateFrom,
      visitDateTo:   effectiveVisitDateTo,
      patientName, patientId
    })

    logger.info('GetCorporatePatientsReportService: ', { message: 'Hospital patients report returned', context: { count: JSON.stringify(rows.length) } })

    return { message: 'OK', rows, count: rows.length }
  }
}
