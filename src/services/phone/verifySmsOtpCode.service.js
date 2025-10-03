import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import UserTokenRepository from '../../infrastructure/repositories/userTokenRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TOKEN_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    otp: {
      type: 'string'
    }
  },
  required: ['otp']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to verify phone no. of the user
 * @export
 * @class VerifyPhoneNumberService
 * @extends {ServiceBase}
 */
export default class VerifySmsOtpCodeService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    const otp = this.args.otp

    const verifyOtpToken = await UserTokenRepository.findByTokenAndType(otp, TOKEN_TYPE.phone)
    logger.info('VerifySmsOtpCodeService: ', { message: 'this is the verifyOtpToken: ', context: { verifyOtpToken } })

    if (!verifyOtpToken) {
      return this.addError('InvalidTokenErrorType', 'Token is Expired or not valid')
    }

    const userUpdateObject = {
      phoneVerified: true,
      verifiedAt: Date
    }

    await UserRepository.update(verifyOtpToken.userId, userUpdateObject, sequelizeTransaction)

    await UserTokenRepository.destroy(verifyOtpToken.id, sequelizeTransaction)

    return { message: 'User Phone Verified' }
  }
}
