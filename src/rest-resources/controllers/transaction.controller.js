import { sendResponse } from '../../helpers/response.helpers'
// import GetTransactionInfoService from '../../services/transactions/getTransactionInfo.service'
// import GetUserTransactionsService from '../../services/transactions/getUserTransaction.service'

/**
 * Transaction Controller for handling all the request of /transaction path
 *
 * @export
 * @class TransactionController
 */

export default class TransactionController {
  static async getTransactionsInfo (req, res, next) {
    try {
      const { result, successful, errors } = await GetTransactionInfoService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getUserTransactions (req, res, next) {
    try {
      const { result, successful, errors } = await GetUserTransactionsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
