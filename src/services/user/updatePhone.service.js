import APIError from '../../errors/api.error'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'

const schema = {
  type: 'object',
  properties: {
    countryCode: {
      type: 'string',
      pattern: '^[0-9]+$',
      minLength: 1,
      maxLength: 3
    },
    newPhone: {
      type: 'string',
      pattern: '^[0-9]+$',
      minLength: 5,
      maxLength: 15
    }
  },
  required: ['countryCode', 'newPhone']
}

const constraints = ajv.compile(schema)

/**
 * Provides service for the updating phone functionality
 * @export
 * @class UpdatePhoneService
 * @extends {ServiceBase}
 */
export default class UpdatePhoneService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      //  req: { headers: { language } },
      dbModels: {
        User: UserModel
      },
      auth: { id: userId },
      sequelizeTransaction
    } = this.context

    const { countryCode, newPhone } = this.args

    const phoneExist = await UserModel.findOne({
      where: {
        phone: newPhone,
        countryCode: countryCode
      },
      transaction: sequelizeTransaction
    })

    if (phoneExist) {
      throw new APIError({ name: 'PhoneAlreadyExistError', description: 'Phone no. Already Exist' })
    }

    const phoneVerified = true // TODO: once OTP feature is enabled then make it false

    const user = await UserModel.update({
      phone: newPhone,
      countryCode: countryCode,
      phoneVerified
    }, {
      where: {
        id: userId
      },
      transaction: sequelizeTransaction
    })

    if (user) {
      return { countryCode, phone: newPhone, message: 'Phone no updated' }
      // const otp = Math.random().toString().substring(2, 8)

      // const userToken = await UserTokenModel.create({
      //   userId: this.context.auth.id,
      //   tokenType: 'phone',
      //   token: otp
      // }, { transaction: sequelizeTransaction })

      // try {
      //   await sendPhoneVerificationOTP(
      //     this.args.newPhone,
      //     this.args.phoneCode,
      //     otp,
      //     this.context
      //   )
      //   return this.args
      // } catch (error) {
      //   await UserTokenModel.destroy({
      //     where: {
      //       id: userToken.id
      //     },
      //     transaction: sequelizeTransaction
      //   })
      //   throw new UserInputError(translate('INVALID_PHONE_NUMBER', language))
      // }
    } else {
      throw new APIError({ name: 'UserNotExistsError', description: 'User not Found' })
    }
  }
}
