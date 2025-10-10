import express from 'express'
import DoctorController from '../../../controllers/doctor.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'

const getDoctorPatientsSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'string',
        pattern: '^[0-9]+$'
      },
      offset: {
        type: 'string',
        pattern: '^[0-9]+$'
      },
      searchTerm: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              userId: { type: 'number' },
              dateOfBirth: { type: ['string', 'null'], format: 'date-time' },
              gender: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  firstName: { type: ['string', 'null'] },
                  lastName: { type: ['string', 'null'] },
                  email: { type: ['string', 'null'] },
                  phone: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      },
      required: ['count', 'rows']
    }
  }
}

const getDoctorPatientsTestResultsSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'string',
        pattern: '^[0-9]+$'
      },
      offset: {
        type: 'string',
        pattern: '^[0-9]+$'
      },
      searchTerm: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              individualId: { type: 'number' },
              corporateId: { type: ['number', 'null'] },
              doctorId: { type: ['number', 'null'] },
              name: { type: 'string' },
              status: { type: 'string' },
              sample: { type: 'string' },
              duration: { type: ['number', 'null'] },
              errorMessage: { type: ['string', 'null'] },
              errorType: { type: ['string', 'null'] },
              startTime: { type: ['string', 'null'], format: 'date-time' },
              endTime: { type: ['string', 'null'], format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              individual: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  userId: { type: 'number' },
                  dateOfBirth: { type: ['string', 'null'], format: 'date-time' },
                  gender: { type: ['string', 'null'] },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      firstName: { type: ['string', 'null'] },
                      lastName: { type: ['string', 'null'] },
                      email: { type: ['string', 'null'] },
                      phone: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      required: ['count', 'rows']
    }
  }
}

const doctorRoutes = express.Router()

doctorRoutes.route('/get-patients')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getDoctorPatientsSchemas),
  authenticationMiddleWare,
  checkPermission,
  DoctorController.getDoctorPatients,
  responseValidationMiddleware(getDoctorPatientsSchemas)
)

doctorRoutes.route('/get-patients-test-results')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getDoctorPatientsTestResultsSchemas),
  authenticationMiddleWare,
  checkPermission,
  DoctorController.getDoctorPatientsTestResults,
  responseValidationMiddleware(getDoctorPatientsTestResultsSchemas)
)

export default doctorRoutes
