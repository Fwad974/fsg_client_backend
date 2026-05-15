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

export default class AcknowledgeAlertsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { uuids } = this.args
    logger.info('AcknowledgeAlertsService: ', { message: 'Acknowledging alerts in bulk', context: { uuids: JSON.stringify(uuids) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('AcknowledgeAlertsService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const found = await TestAlertRepository.findNotAcknowledgedByUuidsAndHospitalId(uuids, user.hospitalId)
    logger.info('AcknowledgeAlertsService: ', { message: 'Not-acknowledged alerts fetched for caller hospital', context: { found: JSON.stringify(found) } })

    if (found.length !== uuids.length) return this.addError('TestAlertsNotResolvableErrorType')

    const ids = extractIds(found)
    logger.info('AcknowledgeAlertsService: ', { message: 'Extracted alert ids', context: { ids: JSON.stringify(ids) } })

    const updateResult = await TestAlertRepository.update(ids, { acknowledgedAt: new Date(), acknowledgedByUserId: user.id })
    logger.info('AcknowledgeAlertsService: ', { message: 'Bulk acknowledge update result', context: { updateResult: JSON.stringify(updateResult) } })

    return { message: 'OK', acknowledgedCount: ids.length }
  }
}
