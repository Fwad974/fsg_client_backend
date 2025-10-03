import _ from 'lodash'
import moment from 'moment'
import { Op } from 'sequelize'
import ajv from '../../libs/ajv'
import { USER_TYPES } from '../../libs/constants'
import ServiceBase from '../../libs/serviceBase'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    limit: { type: 'string' },
    offset: { type: 'string' },
    status: { type: 'string' },
    paymentMethod: { type: 'string', default: 'receive' },
    transactionType: { type: 'string', default: 'tipping' },
    sortingBy: { type: 'string', default: 'createdAt' },
    sortingOrder: { type: 'string', default: 'ASC' },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' }
  }
}

const constraints = ajv.compile(schema)

export default class GetUserTransactionsService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        PaymentTransaction: PaymentTransactionModel,
        User: UserModel
      },
      sequelizeTransaction
    } = this.context

    const { limit, offset, status, transactionType, paymentMethod, sortingBy, sortingOrder, startDate, endDate } = this.args
    Logger.info('', { message: `getUserTransactionsService args: ${JSON.stringify(this.args)}` })

    const whereCondition = {
      status,
      paymentMethod,
      transactionType,
      actioneeType: USER_TYPES.USER,
      actioneeId: this.context.auth.id,
      ...((startDate && endDate)
        ? { createdAt: { [Op.between]: [moment(startDate).startOf('day'), moment(endDate).endOf('day')] } }
        : {})
    }
    Logger.info('', { message: `getUserTransactionsService whereCondition: ${JSON.stringify(whereCondition)}` })

    const filterTransactions = _.omitBy(whereCondition, _.isNil)

    Logger.info('', { message: `getUserTransactionsService filterTransactions: ${JSON.stringify(filterTransactions)}` })

    const allTransactions = await PaymentTransactionModel.findAndCountAll({
      where: filterTransactions,
      include: [{
        model: UserModel,
        attributes: ['userName', 'id'],
        as: 'source'
      }],
      offset,
      limit,
      order: [
        [sortingBy || 'createdAt', sortingOrder || 'DESC']
      ],
      transaction: sequelizeTransaction
    })

    Logger.info('', { message: `getUserTransactionsService allTransactions: ${JSON.stringify(allTransactions)}` })

    const totalAmount = await PaymentTransactionModel.sum('amount', {
      where: filterTransactions
    })
    Logger.info('', { message: `getUserTransactionsService totalAmount: ${totalAmount}` })
    Logger.info('', { message: `getUserTransactionsService count: ${allTransactions.count}` })
    return {
      totalAmount,
      count: allTransactions.count,
      rows: allTransactions.rows
    }
  }
}
