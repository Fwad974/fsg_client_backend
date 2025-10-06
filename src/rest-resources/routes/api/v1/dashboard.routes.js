import express from 'express'
import DashboardController from '../../../controllers/dashboard.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'

const transactionRoutes = express.Router()

transactionRoutes.route('/get-all-test-results')
.get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  checkPermission,
  DashboardController.getAllTestResult,
  responseValidationMiddleware()
)

transactionRoutes.route('/get-patient-test-results')
.get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  checkPermission,
  DashboardController.getAllTestResult,
  responseValidationMiddleware()
)

transactionRoutes.route('/get-patient-reports')
.get(
  contextMiddleware(),
  requestValidationMiddleware(),
  authenticationMiddleWare,
  checkPermission,
  DashboardController.getAllTestResult,
  responseValidationMiddleware()
)

export default transactionRoutes
