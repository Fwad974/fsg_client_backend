import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import { SALT_ROUNDS } from '../../libs/constants'
import bcrypt from 'bcrypt'
import UserTokenRepository from '../../infrastructure/repositories/userTokenRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { TOKEN_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    otp: { type: 'string' },
    phone: { type: 'string' },
    newPassword: {
      type: 'string',
      minLength: 5,
      pattern: '^[A-Za-z0-9\\-~#^()\\[\\]{}"\':;<,>.\\|!@*$]{5,50}$'
    }
  },
  required: ['otp', 'newPassword', 'phone']
}

const constraints = ajv.compile(schema)

/**
 * Provides service for the changePassword functionality
 * @export
 * @class ChangePasswordService
 * @extends {ServiceBase}
 */

export default class ChangePasswordByOtpService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    logger.info('ForgotPasswordService: ', { message: 'this is the this.args' , context: { args: JSON.stringify(this.args)} })

    const {
      phone,
      otp,
      newPassword
     } = this.args

    const user = await UserRepository.findByPhone(phone, { attributes: ['id', 'phone', 'userName', 'phoneVerified'] })
    logger.info('ForgotPasswordService: ', { message: 'this is the user' , context: { user} })

    if (!user) return this.addError('UserNotExistsErrorType', `user: ${user}`)
    if (!user.phoneVerified) return this.addError('PhoneNotVerifiedErrorType', `email: ${user.phone}`)

    const userHasToken = await UserTokenRepository.findByUserIdAndTokenType(user.id, TOKEN_TYPE.phone)

    if (!userHasToken) {
      this.addError('OTPCodeInvalidErrorType')
    }

    if (userHasToken.token !== otp) {
      this.addError('OTPCodeInvalidErrorType')
    }

    const newEncryptedPassword = await bcrypt.hash(
      this.args.newPassword,
      SALT_ROUNDS
    )

    const userUpdateObject = {
      encryptedPassword: newEncryptedPassword
    }

    await UserRepository.update(user.id, userUpdateObject, sequelizeTransaction)

    await UserTokenRepository.destroy(verifyOtpToken.id, sequelizeTransaction)

    return { message: 'Password Changed successfully' }
  }
}
