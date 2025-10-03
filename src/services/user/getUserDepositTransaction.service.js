import _ from 'lodash'
import { Op } from 'sequelize'
import moment from 'moment'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import { TRANSACTION_TYPES } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    limit: { type: 'string' },
    offset: { type: 'string' },
    status: { type: 'string' },
    currencyCode: { type: 'string' },
    sortingBy: { type: 'string', default: 'createdAt' },
    sortingOrder: { type: 'string', default: 'ASC' },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' }
  }
}

const constraints = ajv.compile(schema)

export default class GetUserDepositTransactionService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        PaymentTransaction: PaymentTransactionModel,
        Wallet: WalletModel,
        Currency: CurrencyModel
      },
      sequelizeTransaction
    } = this.context

    const { limit, offset, status, currencyCode, sortingBy, sortingOrder, startDate, endDate } = this.args

    const whereCondition1 = {
      actioneeId: this.context.auth.id,
      transactionType: TRANSACTION_TYPES.DEPOSIT || TRANSACTION_TYPES.BONUS_DEPOSIT,
      status,
      ...((startDate && endDate)
        ? { createdAt: { [Op.between]: [moment(startDate).startOf('day'), moment(endDate).endOf('day')] } }
        : {})
    }
    const whereCondition2 = {
      code: currencyCode
    }

    const filterTransactions = _.omitBy(whereCondition1, _.isNil)
    const filterCurrency = _.omitBy(whereCondition2, _.isNil)

    const allTransactions = await PaymentTransactionModel.findAndCountAll({
      where: filterTransactions,
      offset,
      limit,
      include: [{
        model: WalletModel,
        as: 'sourceWallet',
        include: [{
          model: CurrencyModel,
          where: filterCurrency,
          attributes: ['name', 'code'],
          as: 'currency'
        }]
      }, {
        model: WalletModel,
        as: 'targetWallet',
        include: [{
          model: CurrencyModel,
          where: filterCurrency,
          attributes: ['name', 'code'],
          as: 'currency'
        }]
      }],
      order: [
        [sortingBy || 'createdAt', sortingOrder || 'DESC']
      ],
      transaction: sequelizeTransaction
    })

    return {
      count: allTransactions.count,
      rows: allTransactions.rows.map(transaction => transaction?.toJSON()) || []
    }
  }
}
