import ServiceBase from '../../libs/serviceBase'
import { Op } from 'sequelize'
/**
 * Provides service to show user details
 * @export
 * @class GetUserDetailService
 * @extends {ServiceBase}
 */
export default class GetUserDetailService extends ServiceBase {
  async run () {
    const {
      dbModels: {
        User: UserModel,
        Wallet: WalletModel,
        Currency: CurrencyModel,
        LinkedSocialAccount: LinkedSocialAccountModel,
        RankingLevel: RankingLevelModel,
        KycVerification: KycVerificationModel,
        Affiliate: AffiliateModel,
        UserLimit: UserLimitModel,
        UserBetActivity: UserBetActivityModel
      },
      headers = {},
      sequelizeTransaction
    } = this.context

    let acceptLanguage = headers['accept-language'] || 'en-US'
    acceptLanguage = acceptLanguage.split(',')[0].split('-')[0]

    const userLimits = await UserLimitModel.findOne({
      where: { userId: this.context.auth.id },
      attributes: [
        'dailyBetLimit',
        'weeklyBetLimit',
        'monthlyBetLimit',
        'dailyLossLimit',
        'weeklyLossLimit',
        'monthlyLossLimit'
      ],
      raw: true,
      transaction: sequelizeTransaction
    })

    const userBetActivity = await UserBetActivityModel.findOne({
      where: { userId: this.context.auth.id },
      raw: true,
      transaction: sequelizeTransaction
    })

    let isLimit = false
    if (userLimits) {
      if (userLimits.dailyBetLimit !== null && userBetActivity?.dailyBet >= userLimits.dailyBetLimit) {
        isLimit = true
      }
      if (userLimits.dailyLossLimit !== null && (userBetActivity?.dailyBet - userBetActivity?.dailyWin) >= userLimits.dailyLossLimit) {
        isLimit = true
      }

      if (userLimits.weeklyBetLimit !== null && userBetActivity?.weeklyBet >= userLimits.weeklyBetLimit) {
        isLimit = true
      }
      if (userLimits.weeklyLossLimit !== null && (userBetActivity?.weeklyBet - userBetActivity?.weeklyWin) >= userLimits.weeklyLossLimit) {
        isLimit = true
      }

      if (userLimits.monthlyBetLimit !== null && userBetActivity?.monthlyBet >= userLimits.monthlyBetLimit) {
        isLimit = true
      }
      if (userLimits.monthlyLossLimit !== null && (userBetActivity?.monthlyBet - userBetActivity?.monthlyWin) >= userLimits.monthlyLossLimit) {
        isLimit = true
      }
    }

    // First check if user has systemLevel KYC
    const hasSystemLevelKyc = await KycVerificationModel.findOne({
      where: {
        userId: this.context.auth.id,
        verificationLevel: 'systemLevel'
      },
      transaction: sequelizeTransaction
    })

    // Build include array conditionally
    const includeArray = [
      {
        model: WalletModel,
        required: false,
        as: 'wallets',
        include: [
          {
            model: CurrencyModel,
            required: false,
            as: 'currency'
          }
        ]
      },
      {
        model: RankingLevelModel,
        required: false,
        as: 'userRank'
      },
      {
        model: LinkedSocialAccountModel,
        required: false,
        as: 'linkedAccounts'
      },
      {
        model: AffiliateModel,
        required: false,
        as: 'affiliate'
      }
    ]

    // Only include KYC if systemLevel exists
    if (hasSystemLevelKyc) {
      includeArray.push({
        model: KycVerificationModel,
        required: false,
        as: 'kycVerification'
      })
    }

    const user = await UserModel.findOne({
      where: {
        id: this.context.auth.id
      },
      include: includeArray,
      transaction: sequelizeTransaction
    })
    if (!user) {
      this.addError('UserNotFoundErrorType')
      return
    }

    if (user.userRank) {
      user.dataValues.userRank = {
        ...user.userRank.toJSON(),
        rank: user.userRank.rank[acceptLanguage] || user.userRank.rank.en,
        description: user.userRank.description[acceptLanguage] || user.userRank.description.en || ''
      }
    }

    if (user.userRank?.id) {
      const currentWagerRequirement = user.userRank.wagerRequirement

      const nextRankingLevels = await RankingLevelModel.findAll({
        where: {
          wagerRequirement: {
            [Op.gt]: currentWagerRequirement
          }
        },
        order: [['wagerRequirement', 'ASC']],
        limit: 4,
        transaction: sequelizeTransaction
      })

      user.dataValues.nextRankingLevels = nextRankingLevels.map(level => ({
        ...level.toJSON(),
        rank: level.rank[acceptLanguage] || level.rank.en,
        description: level.description[acceptLanguage] || level.description.en || ''
      }))
    }
    const userJson = user.toJSON()

    if (userJson.wallets?.length) {
      for (const wallet of userJson.wallets) {
        if (wallet.currency) {
          wallet.currency.sort = wallet.currency.sortOrder
          delete wallet.currency.sortOrder
        }
      }
    }

    userJson.affiliatedBy = user.affiliatedBy || null
    userJson.referrerCode = user.referrerCode || null
    if (user.affiliate && user.affiliate.code) {
      userJson.affiliatedBy = user.affiliate.code
    }

    if (user.affiliateById) {
      const referrerAffiliate = await AffiliateModel.findOne({
        where: { id: user.affiliateById },
        transaction: sequelizeTransaction
      })

      if (referrerAffiliate && referrerAffiliate.ownerId) {
        const referrerUser = await UserModel.findOne({
          where: { id: referrerAffiliate.ownerId },
          transaction: sequelizeTransaction
        })

        if (referrerUser) {
          userJson.referrerCode = referrerUser.referralCode || referrerAffiliate.code
          userJson.referrerUsername = referrerUser.userName || null
        }
      }
    }

    userJson.isLimit = isLimit

    // If no systemLevel KYC exists, set kycVerification to empty array
    if (!hasSystemLevelKyc) {
      userJson.kycVerification = []
    }

    return userJson
  }
}
