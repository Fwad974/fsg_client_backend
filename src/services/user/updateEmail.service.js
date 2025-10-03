import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import { EMAIL_TEMPLATE_CATEGORY } from '../../libs/constants'
import { setData } from '../../helpers/redis.helpers'
import SendEmailService from '../email/sendEmail.service'

const schema = {
  type: 'object',
  properties: {
    oldEmail: { type: 'string' },
    newEmail: { type: 'string' }
  },
  required: ['oldEmail', 'newEmail']
}

const constraints = ajv.compile(schema)

/**
 * Provides service for the change email functionality
 * @export
 * @class UpdateEmailService
 * @extends {ServiceBase}
 */

export default class UpdateEmailService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        User: UserModel
      },
      auth: { id: userId },
      logger
    } = this.context

    const {
      newEmail,
      oldEmail
    } = this.args

    logger.info('UpdateEmailService: ', { message: `this is the args: ${JSON.stringify(this.args)}` })

    const currentUser = await UserModel.findOne({
      where: { id: userId },
      raw: true
    })

    if (currentUser.email !== oldEmail) {
      return this.addError('InvalidCredentialsErrorType')
    }

    const checkEmailExist = await UserModel.findOne({
      where: { email: newEmail },
      raw: true
    })

    if (checkEmailExist) {
      return this.addError('EmailAlreadyExist')
    }

    const OTP = (() => Math.floor(100000 + Math.random() * 900000).toString())()

    const userData = {
      OTP: OTP,
      email: this.args.newEmail
    }
    setData(userId, JSON.stringify(userData), 6000)

    SendEmailService.run(
      { userName: currentUser.userName, uuid: currentUser.uuid, email: newEmail, OTP, category: EMAIL_TEMPLATE_CATEGORY.UPDATE_EMAIL },
      this.context
    )

    return {
      message: 'OTP Sent To New Email'
    }
  }
}
