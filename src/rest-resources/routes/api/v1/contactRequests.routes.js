import express from 'express'
import ContactRequestController from '../../../controllers/contactRequest.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const submitContactRequestSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      name:          { type: 'string', minLength: 1, maxLength: 100 },
      email:         { type: 'string', format: 'email', maxLength: 255 },
      address:       { type: 'string', maxLength: 500 },
      contactNumber: { type: 'string', pattern: '^\\+?[0-9\\s\\-\\(\\)]{7,20}$', maxLength: 20 },
      organization:  { type: 'string', maxLength: 100 },
      message:       { type: 'string', minLength: 1, maxLength: 1000 }
    },
    required: ['name', 'email', 'message']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message:   { type: 'string' },
        requestId: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const contactRequestsRoutes = express.Router()

contactRequestsRoutes.route('/submit').post(
  contextMiddleware(true),
  authenticationMiddleware,
  requestValidationMiddleware(submitContactRequestSchemas),
  ContactRequestController.submit,
  responseValidationMiddleware(submitContactRequestSchemas)
)

export default contactRequestsRoutes
