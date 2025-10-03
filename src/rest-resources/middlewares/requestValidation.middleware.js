import RequestInputValidationError from '../../errors/requestInputValidation.error'
import ajv from '../../libs/ajv'
import localize from 'ajv-i18n'

/**
 * A Socket Context Data type
 * @typedef {Object} RestRequestSchemas
 * @property {import('ajv').Schema} querySchema
 * @property {import('ajv').Schema} paramsSchema
 * @property {import('ajv').Schema} bodySchema
 */

/**
 *
 * @memberof Rest Middleware
 * @export
 * @name requestValidationMiddleware
 * @param {RestRequestSchemas} schema
 * @return {function}
 * It will return a express style middleware function with closure of query, params, and body json schema
 * If there is any error while validating the schemas it will log error and return RequestInputValidationError
 *
 * @example
 * // you can define request schemas
 * // for body, query and params
 * requestValidationMiddleware({
 *   querySchema: {
 *     type: 'string'
 *   },
 *   paramsSchema: {
 *     type: 'string'
 *   },
 *   bodySchema: {
 *     type: 'string'
 *   }
 * })
 */
export default function requestValidationMiddleware ({ querySchema = {}, paramsSchema = {}, bodySchema = {} } = {}) {
  const compiledQuerySchema = ajv.compile(querySchema)
  const compiledParamsSchema = ajv.compile(paramsSchema)
  const compiledBodySchema = ajv.compile(bodySchema)

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} _
   * @param {import('express').NextFunction} next
  */
  return (req, _, next) => {
    const errorPayload = {}
    let error = false

    const locale = req.locale.split('-')[0]

    if (compiledQuerySchema) {
      if (!compiledQuerySchema(req.query)) {
        error = true
        localize[locale](compiledQuerySchema.errors)
        errorPayload.query = ajv.errorsText(compiledQuerySchema.errors, { separator: ' ||||| ' }).split(' ||||| ')
      }
    }

    if (compiledParamsSchema) {
      if (!compiledParamsSchema(req.params)) {
        error = true
        localize[locale](compiledParamsSchema.errors)
        errorPayload.params = ajv.errorsText(compiledParamsSchema.errors, { separator: ' ||||| ' }).split(' ||||| ')
      }
    }

    if (compiledBodySchema) {
      if (!compiledBodySchema(req.body)) {
        error = true
        localize[locale](compiledBodySchema.errors)
        errorPayload.body = ajv.errorsText(compiledBodySchema.errors, { separator: ' ||||| ' }).split(' ||||| ')
      }
    }

    if (error) {
      const validationError = new RequestInputValidationError(errorPayload)

      next(validationError)
    } else {
      next()
    }
  }
}
