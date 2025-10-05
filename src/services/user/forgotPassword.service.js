import ServiceBase from '../../libs/serviceBase'
import GenerateVerificationCodeService from '../generateCode/generateVerificationCode.service'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TOKEN_TYPE } from '../../libs/constants'

export default class ForgotPasswordService extends ServiceBase {
  async run () {
    const {
      logger
    } = this.context

    const phone = this.args.phone

    const user = await UserRepository.findByPhone(phone, { attributes: ['id', 'phone', 'userName', 'phoneVerified'] })
    logger.info('ForgotPasswordService: ', { message: 'this is the user' , context: { user} })

    if (!user) return this.addError('UserNotExistsErrorType', `user: ${user}`)
    if (!user.phoneVerified) return this.addError('PhoneNotVerifiedErrorType', `email: ${user.phone}`)

    await GenerateVerificationCodeService.run({ phoneNumber: user.phone, userId: user.id, userName: user.userName, tokenType: TOKEN_TYPE.phone }, this.context)

    return { message: 'please check your phone' }
  }
}
