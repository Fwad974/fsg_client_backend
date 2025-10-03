import _ from 'lodash'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import { AFFILIATE_STATUS, TRANSACTION_STATUS, TRANSACTION_TYPES } from '../../libs/constants'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    userName: {
      type: 'string',
      // pattern: '^[a-zA-Z0-9]*$',
      pattern: "^[A-Za-z0-9-~#^()\\[\\]{}\"':;<,>./|\\\\_]{5,50}$",
      minLength: 2,
      maxLength: 50
    },
    firstName: {
      type: 'string',
      pattern: '^[a-zA-Z]*$',
      minLength: 2,
      maxLength: 50
    },
    lastName: {
      type: 'string',
      pattern: '^[a-zA-Z]*$',
      minLength: 2,
      maxLength: 50
    },
    dateOfBirth: {
      type: 'string'
    },
    signInIp: {
      type: 'string'
    },
    gender: {
      type: 'string'
      // inclusion: ['male', 'female', 'other']
    },
    locale: {
      type: 'string',
      pattern: '^[a-zA-Z]*$',
      minLength: 2,
      maxLength: 30
    },
    phone: { type: 'string' },
    phoneCode: { type: 'string' }
  }
}

const constraints = ajv.compile(schema)

/**
 * Provides service for the updating user profile functionality
 * @export
 * @class UpdateProfileService
 * @extends {ServiceBase}
 */
export default class UpdateProfileService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: { User: UserModel, PaymentTransaction: PaymentTransactionModel, Wallet: WalletModel, Affiliate: AffiliateModel, UserLimit: UserLimitModel },
      auth: { id: userId },
      sequelizeTransaction,
      acceptLanguage,
      ipAddress,
      userAgent
    } = this.context

    let language = acceptLanguage || 'en-US'
    language = language.split(',')[0].split('-')[0]
    Logger.info('Update Profile Service language: ', { message: JSON.stringify(language) })

    const userObj = {
      userName: this.args?.userName?.toLowerCase?.(),
      firstName: this.args.firstName,
      lastName: this.args.lastName,
      dateOfBirth: this.args?.dateOfBirth,
      signInIp: this.args.signInIp,
      gender: this.args.gender,
      locale: this.args.locale,
      phone: this.args?.phone,
      phoneCode: this.args?.phoneCode
    }

    if (userObj.userName) {
      const userDetail = await UserModel.findOne({
        where: {
          userName: userObj.userName
        }
      },
      { transaction: sequelizeTransaction }
      )

      if (userDetail && userDetail.id !== userId) {
        return this.addError(
          'UserNameAlreadyTakenErrorType',
        `UserId : ${userObj.userName}`
        )
      }
    }

    if (
      userObj.dateOfBirth &&
      new Date(new Date().setUTCFullYear(new Date().getUTCFullYear() - 18)) <
      new Date(userObj.dateOfBirth)
    ) {
      return this.addError(
        'UserNotAbove18YearsErrorType',
        `User age: ${userObj.dateOfBirth}`
      )
    }

    const user = await UserModel.update(_(userObj).omit(_.isUndefined).omit(_.isNull).value(), {
      where: { id: userId },
      individualHooks: true,
      transaction: sequelizeTransaction
    })

    if (!user) {
      return this.addError('UserNotExistsErrorType', `userId: ${userId}`)
    }

    const countryData = await getCountryFromIP(ipAddress)
    Logger.info('Update Profile Service countryData: ', { message: JSON.stringify(countryData) })

    const depositCount = await PaymentTransactionModel.count({
      where: {
        actioneeId: userId,
        transactionType: TRANSACTION_TYPES.DEPOSIT,
        status: TRANSACTION_STATUS.SUCCESS
      },
      transaction: sequelizeTransaction
    })
    Logger.info('Update Profile Service depositCount: ', { message: JSON.stringify(depositCount) })
    const withdrawalCount = await PaymentTransactionModel.count({
      where: {
        actioneeId: userId,
        transactionType: TRANSACTION_TYPES.WITHDRAW,
        status: TRANSACTION_STATUS.SUCCESS
      },
      transaction: sequelizeTransaction
    })
    Logger.info('Update Profile Service withdrawalCount: ', { message: JSON.stringify(withdrawalCount) })

    const userWallet = await WalletModel.findOne({
      where: { ownerId: userId, primary: true },
      transaction: sequelizeTransaction
    })
    Logger.info('Update Profile Service userWallet: ', { message: JSON.stringify(userWallet) })
    const { firstName, lastName, userName, signInIp, gender, locale, dateOfBirth, phoneCode, phone } = user
    const updatedUser = await UserModel.findOne({
      where: {
        id: userId
      },
      transaction: sequelizeTransaction
    })
    let userAffiliatedBy = null
    const affiliatedByCode = updatedUser.affiliatedBy
    const affiliate = await AffiliateModel.findOne({
      where: {
        code: affiliatedByCode,
        status: AFFILIATE_STATUS.ACTIVE
      },
      paranoid: false,
      transaction: sequelizeTransaction
    })
    if (affiliate) {
      userAffiliatedBy = await UserModel.findOne({
        where: {
          id: affiliate.ownerId
        },
        transaction: sequelizeTransaction
      })
    }



    return {
      firstName,
      lastName,
      dateOfBirth,
      userName,
      signInIp,
      gender,
      locale,
      phone,
      phoneCode,
      message: 'User Profile updated'
    }
  }
}
