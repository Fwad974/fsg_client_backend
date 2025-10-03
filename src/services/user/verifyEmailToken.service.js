import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import {
  AFFILIATE_STATUS,
  BONUS_TYPES,
  BONUS_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS
} from '../../libs/constants'
import Logger from '../../libs/logger'
import BonusReferralEventService from '../urm/events/bonusReferral.service'
import ProfileUpdateEventService from '../urm/events/profileUpdate.service'
import { toIsoWithOffset } from '../../utils/date.utils'
import { getCountryFromIP } from '../../utils/getCountryFromIP'
import EmailVerifiedEventService from '../urm/events/emailVerifiedEvent.service'
import { Op } from 'sequelize'
import DistributeRegistrationBonusService from '../bonus/distributeRegistrationBonus.service'

const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'integer'
    },
    token: {
      type: 'string'
    }
  },
  required: ['id', 'token']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to verify email token
 * @export
 * @class VerifyEmailTokenService
 * @extends {ServiceBase}
 */
export default class VerifyEmailTokenService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        User: UserModel,
        UserToken: UserTokenModel,
        Affiliate: AffiliateModel,
        Bonus: BonusModel,
        UserBonus: UserBonusModel,
        PaymentTransaction: PaymentTransactionModel,
        Wallet: WalletModel
      },
      sequelizeTransaction
    } = this.context

    const userObj = {
      token: this.args.token,
      id: this.args.id
    }

    const { ipAddress } = this.context
    const { userAgent } = this.context

    const currentDate = new Date()
    const expirationDate = new Date(
      currentDate.setHours(currentDate.getHours() - 3)
    )
    const validToken = await UserTokenModel.findOne({
      where: {
        [Op.and]: [
          { userId: userObj.id },
          { tokenType: 'email' },
          { token: userObj.token },
          { updatedAt: { [Op.gt]: expirationDate } }
        ]
      },
      transaction: sequelizeTransaction
    })

    if (!validToken) {
      return this.addError('InvalidVerificationTokenErrorType', 'Token is not valid')
    }

    const user = await UserModel.findOne({
      where: { id: userObj.id },
      include: [
        {
          model: WalletModel,
          as: 'wallets'
        }
      ],
      transaction: sequelizeTransaction
    })

    if (!user) {
      return this.addError('UserNotExistsErrorType', 'User not found')
    }

    try {
      await UserTokenModel.destroy({
        where: {
          [Op.and]: [{ userId: userObj.id }, { token: userObj.token }, { tokenType: 'email' }]
        },
        transaction: sequelizeTransaction
      })

      await user.update(
        {
          emailVerified: true,
          verifiedAt: Date.now()
        },
        {
          individualHooks: true,
          transaction: sequelizeTransaction
        }
      )

      const updatedUser = await UserModel.findOne({
        where: { id: userObj.id },
        transaction: sequelizeTransaction
      })
      const countryData = await getCountryFromIP(ipAddress)
      Logger.info('Update verifyEmailToken Service countryData: ', { message: JSON.stringify(countryData) })
      const depositCount = await PaymentTransactionModel.count({
        where: {
          actioneeId: userObj.id,
          transactionType: TRANSACTION_TYPES.DEPOSIT,
          status: TRANSACTION_STATUS.SUCCESS
        },
        transaction: sequelizeTransaction
      })
      Logger.info('Update verifyEmailToken Service depositCount: ', { message: JSON.stringify(depositCount) })

      const withdrawalCount = await PaymentTransactionModel.count({
        where: {
          actioneeId: userObj.id,
          transactionType: TRANSACTION_TYPES.WITHDRAW,
          status: TRANSACTION_STATUS.SUCCESS
        },
        transaction: sequelizeTransaction
      })
      Logger.info('Update verifyEmailToken Service withdrawalCount: ', { message: JSON.stringify(withdrawalCount) })

      const userWallet = await WalletModel.findOne({
        where: { ownerId: userObj.id, primary: true },
        transaction: sequelizeTransaction
      })
      Logger.info('Update verifyEmailToken Service userWallet: ', { message: JSON.stringify(userWallet) })

      EmailVerifiedEventService.execute({
        uuid: String(updatedUser.uuid),
        email: String(updatedUser.email),
        urmIp: String(ipAddress),
        userAgent: String(userAgent)
      })

      ProfileUpdateEventService.execute({
        uuid: String(updatedUser.uuid),
        userId: String(updatedUser.id),
        emailVerifiedAt: updatedUser.verifiedAt ? toIsoWithOffset(updatedUser.verifiedAt) : undefined,
        urmIp: String(ipAddress),
        userAgent: String(userAgent)
      })

      const affiliate = await AffiliateModel.findOne({
        where: {
          code: user.affiliatedBy,
          status: AFFILIATE_STATUS.ACTIVE
        },
        paranoid: false,
        transaction: sequelizeTransaction
      })

      if (affiliate) {
        const referrerUser = await UserModel.findOne({
          where: {
            id: affiliate.ownerId
          },
          paranoid: false,
          transaction: sequelizeTransaction
        })

        if (!referrerUser) {
          return this.addError(
            'InvalidReferralCodeErrorType',
            `User of this referralCode: ${userObj.referrerCode} not found`
          )
        } else {
          const activeReferralBonus = await BonusModel.findOne({
            where: { bonusType: BONUS_TYPES.REFERRAL },
            transaction: sequelizeTransaction
          })

          const newUserReferralBonusObj = {}
          if (activeReferralBonus) {
            newUserReferralBonusObj.userId = referrerUser.id
            newUserReferralBonusObj.bonusType = BONUS_TYPES.REFERRAL
            newUserReferralBonusObj.status = BONUS_STATUS.READY_TO_CLAIM
            newUserReferralBonusObj.bonusId = activeReferralBonus.id
            newUserReferralBonusObj.bonusAmount = activeReferralBonus.referralBonusAmount
            newUserReferralBonusObj.referredUserId = user.id

            const newBonus = await UserBonusModel.create(newUserReferralBonusObj, {
              transaction: sequelizeTransaction
            })
            Logger.info('', { message: `verifyEmailToken userReferralBonus created: ${JSON.stringify(newBonus)}` })

            // Execute referral bonus event with newBonus details
            BonusReferralEventService.run({
              uuid: String(referrerUser.uuid),
              status: 'Created',
              amount: isNaN(+newBonus.bonusAmount) ? 0 : +newBonus.bonusAmount,
              bonusId: String(newBonus.bonusId),
              userBonusId: String(newBonus.id),
              urmIp: String(ipAddress),
              userAgent: String(userAgent)
            })
          }
        }
      }

      // Distribute welcome bonus

      const primaryWallet = user.wallets.find(wallets => wallets.primary)
      await DistributeRegistrationBonusService.execute({ userId: user.id, userWalletId: primaryWallet.dataValues.id }, this.context)

      return { message: 'user email verified', email: user.email }
    } catch (error) {
      Logger.info('', { message: `verifyEmailToken SomethingWentWrong error: ${JSON.stringify(error)}` })
      Logger.error('verifyEmailToken error', {
        message: error.message,
        exception: error
      })
      return this.addError('SomethingWentWrongErrorType', 'Token is not valid')
    }
  }
}
