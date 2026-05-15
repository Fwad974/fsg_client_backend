import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestAlertRepository from '../../infrastructure/repositories/testAlertRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'

const schema = {
  type: 'object',
  properties: {
    limit: { type: 'number', minimum: 1, maximum: 100 },
    offset: { type: 'number', minimum: 0 }
  }
}

const constraints = ajv.compile(schema)

export default class GetPendingActionsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { limit, offset } = this.args
    logger.info('GetPendingActionsService: ', { message: 'Listing pending actions for caller hospital', context: { args: JSON.stringify(this.args) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetPendingActionsService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const { rows, count } = await TestAlertRepository.findNotAcknowledgedByHospitalId(user.hospitalId, { limit, offset })
    logger.info('GetPendingActionsService: ', { message: 'Pending alerts fetched', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })

    return { message: 'OK', rows, count }
  }
}
