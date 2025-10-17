import express from 'express'
import PaymentController from '../../../controllers/payment.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'

const getAllCorporatePaymentsSchemas = {
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
              actioneeType: { type: ['string', 'null'] },
              userId: { type: ['number', 'null'] },
              corporateId: { type: ['number', 'null'] },
              amount: { type: ['number', 'null'] },
              status: { type: ['string', 'null'] },
              comments: { type: ['string', 'null'] },
              transactionType: { type: ['string', 'null'] },
              paymentMethod: { type: ['string', 'null'] },
              transactionId: { type: 'string' },
              moreDetails: { type: ['object', 'null'] },
              paymentMethodId: { type: ['number', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              individual: {
                type: ['object', 'null'],
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

const paymentRoutes = express.Router()

paymentRoutes.route('/get-all-corporate-payments')
.get(
  contextMiddleware(),
  requestValidationMiddleware(getAllCorporatePaymentsSchemas),
  authenticationMiddleWare,
  checkPermission,
  PaymentController.getAllCorporatePayments,
  responseValidationMiddleware(getAllCorporatePaymentsSchemas)
)

export default paymentRoutes
