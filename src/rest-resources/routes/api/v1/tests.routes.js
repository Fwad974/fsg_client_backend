import express from 'express'
import TestCategoryController from '../../../controllers/testCategory.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const getCatalogsSchemas = {
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
              testName:       { $ref: '/testCategory.json#/properties/testName' },
              testCode:       { $ref: '/testCategory.json#/properties/testCode' },
              turnAroundTime: { $ref: '/testCategory.json#/properties/tat' }
            }
          }
        },
        count: { type: 'number' }
      },
      required: ['message', 'data', 'count']
    }
  }
}

const testsRoutes = express.Router()

testsRoutes.route('/catalogs').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(getCatalogsSchemas),
  TestCategoryController.getTestCatalog,
  responseValidationMiddleware(getCatalogsSchemas)
)

export default testsRoutes
