import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import UserTokenRepository from '../../infrastructure/repositories/userTokenRepository'
import { TOKEN_TYPE } from '../../libs/constants'
import { randomInt } from 'crypto';

const schema = {
  type: 'object',
  properties: {
    otp: {
      phoneNumber: 'string',
      toekn: 'string'
    }
  },
  required: ['phoneNumber', 'toekn']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to send sms otp code
 * @export
 * @class sendSmsCode
 * @extends {ServiceBase}
 */
export default class sendSmsCode extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    const {
      toekn,
      phoneNumber,
    } = this.args


    return { message: 'sms token send' }
  }
}
