import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'

import GenerateVerificationTokenService from './generateVerificationToken.service'

const schema = {
  type: 'object',
  properties: {
    email: { type: 'string' }
  },
  required: ['email']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to signup the user
 * @export
 * @class SignupService
 * @extends {ServiceBase}
 */
export default class SendVerifyEmailService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        User: UserModel
      }
    } = this.context

    const whereCondition = {
      email: this.args.email
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      paranoid: false
    })

    if (!user) {
      return this.addError('UserNotExistsErrorType', `email: ${this.args.email}`)
    }

    if (user.emailVerified === 'true') {
      return this.addError('EmailAlreadyVerifiedErrorType', `email: ${this.args.email}`)
    }

    await GenerateVerificationTokenService.run({ userId: user.id, userUuid: user.uuid, userEmail: user.email, userName: user.userName, tokenType: 'welcomeAndVerify' }, this.context)

    return {
      message: 'Email sent successfully'
    }
  }
}
