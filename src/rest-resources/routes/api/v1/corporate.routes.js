import express from 'express'
import CorporateController from '../../../controllers/corporate.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'

const getCorporatePatientsSchemas = {
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

const getCorporateDoctorsSchemas = {
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
              licenseNumber: { type: ['string', 'null'] },
              specialty: { type: ['string', 'null'] },
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

const getCorporatePatientsTestResultsSchemas = {
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

const corporateRoutes = express.Router()

corporateRoutes.route('/get-patients')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getCorporatePatientsSchemas),
  authenticationMiddleWare,
  checkPermission,
  CorporateController.getCorporatePatients,
  responseValidationMiddleware(getCorporatePatientsSchemas)
)

corporateRoutes.route('/get-doctors')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getCorporateDoctorsSchemas),
  authenticationMiddleWare,
  checkPermission,
  CorporateController.getCorporateDoctors,
  responseValidationMiddleware(getCorporateDoctorsSchemas)
)

corporateRoutes.route('/get-patients-test-results')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getCorporatePatientsTestResultsSchemas),
  authenticationMiddleWare,
  checkPermission,
  CorporateController.getCorporatePatientsTestResults,
  responseValidationMiddleware(getCorporatePatientsTestResultsSchemas)
)

export default corporateRoutes
