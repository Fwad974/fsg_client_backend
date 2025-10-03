import ServiceBase from '../../libs/serviceBase'
import config from '../../configs/app.config'
import _ from 'lodash'
import ajv from '../../libs/ajv'
import { gameEnginePost } from '../../libs/gameEngineClient'

const schema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    emailCC: { type: ['string', 'null'] },
    category: { type: 'string' },
    amount: { type: 'string' },
    currencyCode: { type: 'string' },
    walletAddress: { type: 'string' },
    userName: { type: 'string' },
    name: { type: 'string' },
    uuid: { type: 'string' },
    urlConfig: { type: ['string', 'null'] },
    OTP: { type: 'string' }
  },
  required: ['email', 'category']
}

const constraints = ajv.compile(schema)

/**
 * Universal email service for sending template-based emails
 * Supports configurable URLs and dynamic data
 * @export
 * @class SendTemplateEmailService
 * @extends {ServiceBase}
 */
export default class SendEmailService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const { dbModels: { CrmTemplate: CrmTemplateModel }, logger } = this.context

    logger.info('SendEmailService: ', { message: `this is the this.args line 39: ${JSON.stringify(this.args)}` })

    const { email, emailCC = null, amount, currencyCode, walletAddress, userName, name, category, urlConfig, OTP, uuid } = this.args

    const crmTemplate = await CrmTemplateModel.findOne({
      where: { category }
    })

    if (!crmTemplate) {
      return this.addError('CrmTemplateNotFound')
    }

    const frontEndUrl = config.get('user_frontend_app_url')
    const appUrl = urlConfig ? `${frontEndUrl}${urlConfig}` : frontEndUrl

    logger.info('SendEmailService: ', { message: `WithdrawService requestWithDrawUrl line 52: ${JSON.stringify(appUrl)}` })

    const emailData = {
      amount,
      appUrl,
      appName: config.get('app.appName'),
      currencyCode,
      OTP,
      walletAddress,
      userName,
      name
    }

    const filteredEmailData = _.omitBy(emailData, _.isNil)

    logger.info('SendEmailService: ', { message: `WithdrawService filteredEmailData line 65: ${JSON.stringify(filteredEmailData)}` })

    try {
      await gameEnginePost('/api/v1/mail/send-mail', {
        email,
        emailCC,
        uuid,
        crmId: crmTemplate.id,
        emailDynamicData: filteredEmailData
      })
    } catch (error) {
      logger.error('SendEmailService: ', { message: error.message, exception: error })
    }
  }
}
