import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'
import { extractIds } from '../../utils/array.utils'

const schema = {
  type: 'object',
  properties: {
    uuids: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 100 }
  },
  required: ['uuids'],
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class AcknowledgeAlertsDownloadService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { uuids } = this.args
    logger.info('AcknowledgeAlertsDownloadService: ', { message: 'Acknowledging critical-report alerts for download', context: { uuids: JSON.stringify(uuids) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('AcknowledgeAlertsDownloadService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const found = await TestAlertRepository.findCriticalReportsNotDownloadAckedByUuidsAndHospitalId(uuids, user.hospitalId)
    logger.info('AcknowledgeAlertsDownloadService: ', { message: 'Critical-report alerts found for caller hospital', context: { found: JSON.stringify(found) } })

    if (found.length !== uuids.length) return this.addError('TestAlertsNotResolvableErrorType')

    const ids = extractIds(found)
    logger.info('AcknowledgeAlertsDownloadService: ', { message: 'Extracted alert ids', context: { ids: JSON.stringify(ids) } })

    const updateResult = await TestAlertRepository.update(ids, { downloadAcknowledgedAt: new Date(), downloadAcknowledgedByUserId: user.id })
    logger.info('AcknowledgeAlertsDownloadService: ', { message: 'Bulk download-acknowledge update result', context: { updateResult: JSON.stringify(updateResult) } })

    return { message: 'OK', acknowledgedCount: ids.length }
  }
}
