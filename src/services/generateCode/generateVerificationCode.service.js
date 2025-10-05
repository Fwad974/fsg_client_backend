import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import UserTokenRepository from '../../infrastructure/repositories/userTokenRepository'
import { TOKEN_TYPE } from '../../libs/constants'
import { randomInt } from 'crypto';

const schema = {
  type: 'object',
  properties: {
    phoneNumber: { type: 'string' },
    userId: { type: 'string' },
    tokenType: { type: 'string' },
  },
  required: ['phoneNumber']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to send otp code
 * @export
 * @class sendSmsVerificationCode
 * @extends {ServiceBase}
 */
export default class GenerateVerificationCodeService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    logger.info('GenerateVerificationCodeService: ', { message: 'this is the this.args', context: { args: JSON.stringify(this.args) } })

    const {
      userId,
      phoneNumber,
      tokenType,
    } = this.args
    let token

    const userHasToken = await UserTokenRepository.findByUserIdAndTokenType(userId, tokenType)
    logger.info('GenerateVerificationCodeService: ', { message: 'this is the userHasToken', context: { userHasToken: JSON.stringify(userHasToken) } })

    if (userHasToken) {
      token = randomInt(100000, 1000000).toString();

      const updateTokenObject = {
        token,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      logger.info('GenerateVerificationCodeService: ', { message: 'this is the updateTokenObject', context: { updateTokenObject: JSON.stringify(updateTokenObject) } } )

      await UserTokenRepository.update(userHasToken.id, updateTokenObject, sequelizeTransaction)
    } else {
      token = randomInt(100000, 1000000).toString();

      const createTokenObject = {
        userId,
        token,
        tokenType: TOKEN_TYPE.phone
      }

      logger.info('GenerateVerificationCodeService: ', { message: 'this is the createTokenObject', context: { createTokenObject: JSON.stringify(createTokenObject) } } )

      await UserTokenRepository.create(createTokenObject, sequelizeTransaction)
    }

    // await sendSmsCode.run({ phoneNumber, token })

    return { message: 'User Phone code varification sent' }
  }
}
