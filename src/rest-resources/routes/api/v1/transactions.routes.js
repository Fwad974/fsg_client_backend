import express from 'express'
import TransactionController from '../../../controllers/transaction.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const transactionRoutes = express.Router()

transactionRoutes.route('/get-transaction-info').get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  TransactionController.getTransactionsInfo,
  responseValidationMiddleware()
)

transactionRoutes.route('/user-transactions').get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  TransactionController.getUserTransactions,
  responseValidationMiddleware()
)

export default transactionRoutes
