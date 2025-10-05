import ServiceBase from '../../libs/serviceBase'
import UserRepository from '../../infrastructure/repositories/userRepository'
import GenerateVerificationCodeService from '../generateCode/generateVerificationCode.service'
import { TOKEN_TYPE } from '../../libs/constants'

/**
 * Provides service to send otp code
 * @export
 * @class sendSmsVerificationCode
 * @extends {ServiceBase}
 */
export default class ResendSmsOtpSignupService extends ServiceBase {
  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    logger.info('ResendSmsOtpSignupService: ', { message: 'this is the this.args', context: { args: JSON.stringify(this.args) } })

    const {
      userNameOrPhone
    } = this.args

    const userExists = await UserRepository.findByPhoneOrUserNameAndNotVerify(userNameOrPhone, { attributes: ['id', 'phone'], transaction: sequelizeTransaction})
    logger.info('ResendSmsOtpSignupService: ', { message: 'this is the userExists', context: { userExists: JSON.stringify(userExists) } })

    await GenerateVerificationCodeService.run({ userId: userExists.id, phoneNumber: userExists.phone, tokenType: TOKEN_TYPE.phone }, this.context)

    return { message: 'varification code sent' }
  }
}
