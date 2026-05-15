import ajv from '../../../libs/ajv'
import ServiceBase from '../../../libs/serviceBase'
import UserRepository from '../../../infrastructure/repositories/userRepository'
import { ACCOUNT_TYPE } from '../../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    attributes: { type: 'array', items: { type: 'string' } }
  },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class ValidateUserHospitalService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { attributes = ['id', 'accountType', 'hospitalId'] } = this.args
    logger.info('ValidateUserHospitalService: ', { message: 'Looking up corporate user link', context: { userId: JSON.stringify(userId), attributes: JSON.stringify(attributes) } })

    const user = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes })
    logger.info('ValidateUserHospitalService: ', { message: 'User row fetched', context: { user: JSON.stringify(user) } })

    if (!user?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    return user
  }
}
