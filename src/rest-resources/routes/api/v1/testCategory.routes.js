import express from 'express'
import TestCategoryController from '../../../controllers/testCategory.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const getAllTestCategoriesSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      search: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100 },
      offset: { type: 'number', minimum: 0 }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              testCode: { type: 'string' },
              testName: { type: 'string' },
              description: { type: 'string' },
              serviceCategory: { type: 'string' },
              tat: { type: 'string' },
              testCategory: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      },
      required: ['message', 'rows', 'count']
    }
  }
}

const testCategoryRoutes = express.Router()

testCategoryRoutes
  .route('/get-all')
  .get(
    contextMiddleware(),
    requestValidationMiddleware(getAllTestCategoriesSchemas),
    authenticationMiddleware,
    TestCategoryController.getAll,
    responseValidationMiddleware(getAllTestCategoriesSchemas)
  )

export default testCategoryRoutes
