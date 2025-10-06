import express from 'express'
import TransactionController from '../../../controllers/transaction.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'

const transactionRoutes = express.Router()

transactionRoutes.route('/coprate-transactions').get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  checkPermission,
  TransactionController.getTransactionsInfo,
  responseValidationMiddleware()
)

transactionRoutes.route('/user-transactions').get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  checkPermission,
  TransactionController.getUserTransactions,
  responseValidationMiddleware()
)

export default transactionRoutes
