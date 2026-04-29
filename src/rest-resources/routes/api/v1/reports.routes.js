import express from 'express'
import ReportManagementController from '../../../controllers/reportManagement.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'

const downloadReportSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      docInstanceUuid: { $ref: '/docInstance.json#/properties/uuid' }
    },
    required: ['docInstanceUuid']
  }
  // No responseSchema — endpoint streams a PDF file via res.download(),
  // not a JSON body. responseValidationMiddleware is skipped.
}

const reportsRoutes = express.Router()

reportsRoutes.route('/download').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(downloadReportSchemas),
  ReportManagementController.downloadReport
)

export default reportsRoutes
