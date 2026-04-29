import express from 'express'
import PatientController from '../../../controllers/patient.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const getReportStatusSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit:          { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset:         { type: ['number', 'string'], minimum: 0 },
      orderBy:        { type: 'string' },
      orderDirection: { type: 'string', enum: ['ASC', 'DESC'] }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName:        { type: ['string', 'null'] },
              receivedDate:    { $ref: '/testResult.json#/properties/createdAt' },
              status:                { $ref: '/testResult.json#/properties/status' },
              estimateDateOfRelease: { $ref: '/testResult.json#/properties/turnAroundTime' },
              docInstanceUuid: { $ref: '/docInstance.json#/properties/uuid' }
            }
          }
        },
        count: { type: 'number' }
      },
      required: ['message', 'data', 'count']
    }
  }
}

const patientRoutes = express.Router()

patientRoutes.route('/report-status').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(getReportStatusSchemas),
  PatientController.getMyReportStatus,
  responseValidationMiddleware(getReportStatusSchemas)
)

export default patientRoutes
