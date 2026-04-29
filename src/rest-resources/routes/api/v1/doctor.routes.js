import express from 'express'
import DoctorController from '../../../controllers/doctor.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const getPatientsSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit:          { type: ['number', 'string'], minimum: 1, maximum: 100 },
      offset:         { type: ['number', 'string'], minimum: 0 },
      search:         { type: 'string' },
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
              patientId: { $ref: '/patient.json#/properties/uuid' },
              name:      { type: ['string', 'null'] },
              dateOfBirth: { $ref: '/patient.json#/properties/dateOfBirth' },
              mobile:    { type: ['string', 'null'] },
              email:     { $ref: '/patient.json#/properties/email' }
            }
          }
        },
        count: { type: 'number' }
      },
      required: ['message', 'data', 'count']
    }
  }
}

const getPatientsReportSchemas = {
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
              patientId:       { $ref: '/patient.json#/properties/uuid' },
              patientName:     { type: ['string', 'null'] },
              visiteDate:      { $ref: '/testResult.json#/properties/createdAt' },
              testDone:        { type: ['string', 'null'] },
              reportDate:      { $ref: '/docInstance.json#/properties/releasedDate' },
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

const doctorRoutes = express.Router()

doctorRoutes.route('/patients').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(getPatientsSchemas),
  DoctorController.getPatients,
  responseValidationMiddleware(getPatientsSchemas)
)

doctorRoutes.route('/patients-report').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(getPatientsReportSchemas),
  DoctorController.getPatientsReport,
  responseValidationMiddleware(getPatientsReportSchemas)
)

export default doctorRoutes
