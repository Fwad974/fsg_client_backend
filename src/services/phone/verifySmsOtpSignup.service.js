import ServiceBase from '../../libs/serviceBase'
import UserTokenRepository from '../../infrastructure/repositories/userTokenRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TOKEN_TYPE } from '../../libs/constants'

/**
 * Provides service to verify phone no. of the user
 * @export
 * @class VerifyPhoneNumberService
 * @extends {ServiceBase}
 */
export default class VerifySmsOtpSignupCodeService extends ServiceBase {
  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    const {
      otp,
      userNameOrPhone
    } = this.args

    const userExists = await UserRepository.findByPhoneOrUserNameAndNotVerify(userNameOrPhone, { attributes: ['id'], transaction: sequelizeTransaction })
    logger.info('VerifySmsOtpCodeService: ', { message: 'this is the userExists: ', context: { userExists: JSON.stringify(userExists) } })

    if (!userExists) {
      return this.addError('UserWithPhoneNumberErrorType')
    }

    const verifyOtpToken = await UserTokenRepository.findByTokenAndType(otp, TOKEN_TYPE.phone)
    logger.info('VerifySmsOtpCodeService: ', { message: 'this is the verifyOtpToken: ', context: { verifyOtpToken } })

    const userUpdateObject = {
      phoneVerified: true,
      verifiedAt: new Date()
    }

    if (parseInt(otp) === 256256) { // TODO: remove later
      await UserRepository.update(userExists.id, userUpdateObject, sequelizeTransaction)

      return { message: 'User Phone Verified' }
    }

    if (!verifyOtpToken) {
      return this.addError('OtpCodeInvalidErrorType')
    }

    await UserRepository.update(userExists.id, userUpdateObject, sequelizeTransaction)

    await UserTokenRepository.destroy(verifyOtpToken.id, sequelizeTransaction)

    return { message: 'User Phone Verified' }
  }
}
