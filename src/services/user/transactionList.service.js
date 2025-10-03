import { TRANSACTION_TYPES, USER_TYPES, PAYMENT_METHODS } from '../../libs/constants'
import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'

const schema = {
  type: 'object',
  properties: {
    limit: { type: 'number' },
    offset: { type: 'number' },
    transactionType: { type: 'string' }
  }
}

const constraints = ajv.compile(schema)

/**
 * Provides the list of all the transaction
 * @class TransactionList
 * @extends {ServiceBase}
 */
export default class TransactionList extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        User: UserModel,
        Transaction: TransactionModel,
        Wallet: WalletModel
      },
      auth: { id: userId },
      sequelizeTransaction
      // req: { headers: { authorization } }
    } = this.context
    const { limit, offset, transactionType } = this.args

    const user = await UserModel.findOne({ where: { id: userId } })

    // Find all the wallet of the user
    const userWallets = await WalletModel.findAll({
      where: {
        ownerId: user.id,
        ownerType: USER_TYPES.USER
      },
      attributes: ['id'],
      raw: true
    })
    // Convert the array of object to simple array
    const walletIds = userWallets.map(function (obj) {
      return obj.id
    })

    let where = {
      paymentMethod: PAYMENT_METHODS.FIREBLOCKS
    }

    if (transactionType === 'deposit') {
      where = {
        targetWalletId: walletIds,
        transactionType: TRANSACTION_TYPES.DEPOSIT
      }
    } else if (transactionType === 'withdraw') {
      where = {
        sourceWalletId: walletIds,
        transactionType: TRANSACTION_TYPES.WITHDRAW
      }
    } else if (transactionType === 'bonus') {
      where = {
        targetWalletId: walletIds,
        transactionType: ['claim_losing_bonus', 'claim_deposit_bonus']
      }
    } else if (transactionType === 'jackpot') {
      where = {
        targetWalletId: walletIds,
        transactionType: ['claim_jackpot']
      }
    }

    const transactions = await TransactionModel.findAndCountAll({
      where,
      order: [['updatedAt', 'DESC']],
      transaction: sequelizeTransaction,
      limit,
      offset
    })

    return {
      count: transactions.count,
      rows: transactions.rows.map(transaction => transaction?.toJSON()) || []
    }
  }
}
