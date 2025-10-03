import express from 'express'
import DashboardController from '../../../controllers/dashboard.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const transactionRoutes = express.Router()

transactionRoutes.route('/get-all-test-results')
.get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  DashboardController.getAllTestResult,
  responseValidationMiddleware()
)

export default transactionRoutes
