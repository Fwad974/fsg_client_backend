import express from 'express'
import DashboardController from '../../../controllers/dashboard.controller'
import authenticationMiddleware from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { checkPermission } from '../../../middlewares/checkPermission.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const overviewSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      from: { type: 'string', format: 'date' },
      to:   { type: 'string', format: 'date' }
    },
    dependencies: { from: ['to'], to: ['from'] },
    additionalProperties: false
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            docStatusOverview: {
              type: 'object',
              properties: {
                total:    { type: 'number' },
                segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status:     { type: 'string', enum: ['received', 'pending-review', 'pending-approval', 'released'] },
                      count:      { type: 'number' },
                      percentage: { type: 'number' }
                    },
                    required: ['status', 'count', 'percentage']
                  }
                }
              },
              required: ['total', 'segments']
            },
            statusOverview: {
              type: 'object',
              properties: {
                testCount:      { type: 'number' },
                processingRate: { type: 'number' },
                pendingAction:  { type: 'number' },
                rejectedRate: {
                  type: 'object',
                  properties: {
                    totalSamples:    { type: 'number' },
                    rejectedSamples: { type: 'number' },
                    rejectedRate:    { type: 'number' }
                  },
                  required: ['totalSamples', 'rejectedSamples', 'rejectedRate']
                },
                testConducted:  { type: 'number' }
              },
              required: ['testCount', 'processingRate', 'pendingAction', 'rejectedRate', 'testConducted']
            }
          },
          required: ['docStatusOverview', 'statusOverview']
        }
      },
      required: ['message', 'data']
    }
  }
}

const testCategoryDistributionSchemas = {
  querySchema: {
    type: 'object',
    properties: {
      year: { type: ['number', 'string'], minimum: 2000, maximum: 2100 }
    },
    additionalProperties: false
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            availableYears: { type: 'array', items: { type: 'number' } },
            categories:     { type: 'array', items: { type: 'string' } },
            months: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'number', minimum: 0, maximum: 11 },
                  counts: {
                    type: 'object',
                    patternProperties: { '^.+$': { type: 'number' } },
                    additionalProperties: false
                  }
                },
                required: ['month', 'counts']
              }
            },
            yearTotal: { type: 'number' }
          },
          required: ['availableYears', 'categories', 'months', 'yearTotal']
        }
      },
      required: ['message', 'data']
    }
  }
}

const dashboardRoutes = express.Router()

dashboardRoutes.route('/overview').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(overviewSchemas),
  DashboardController.getOverview,
  responseValidationMiddleware(overviewSchemas)
)

dashboardRoutes.route('/test-category-distribution').get(
  contextMiddleware(false),
  authenticationMiddleware,
  checkPermission,
  requestValidationMiddleware(testCategoryDistributionSchemas),
  DashboardController.getTestCategoryDistribution,
  responseValidationMiddleware(testCategoryDistributionSchemas)
)

export default dashboardRoutes
