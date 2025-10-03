import Flatted from 'flatted'
import ajv from '../../libs/ajv'
import { StatusCodes } from 'http-status-codes'
import ResponseValidationError from '../../errors/responseValidation.error'

/**
 * A Socket Context Data type
 * @typedef {Object} ResponseSchema
 * @property {import('ajv').Schema} default
 */

/**
 * A Socket Context Data type
 * @typedef {Object} RestResponseSchemas
 * @property {ResponseSchema} responseSchema
 */

/**
 *
 * @memberof Rest Middleware
 * @export
 * @name responseValidationMiddleware
 * @param {RestResponseSchemas}
 * @return {function}
 * It will return a express style middleware function with closure of response json schema
 * If there is any error while validating the schemas it will log error and return APIError
 * Also it will always send response in { data: {}, errors: [] } form
 *
 * @example
 * // you can define response schema
 * // as per the statusCode and for the
 * // rest status code you can define default schema
 * // and you can define global
 * // schema for 2xx or 3xx it will
 * // match all the status code started with 2 or 3
 * responseValidationMiddleware({
 *  responseSchema: {
 *    default: {
 *      type: 'string'
 *    },
 *    200: {
 *      type: 'string'
 *    },
 *    '2xx': {
 *      type: 'string'
 *    }
 *  }
 * })
 */
export default function responseValidationMiddleware ({ responseSchema = {} } = {}) {
  const compiledResponseSchema = {}

  if (responseSchema) {
    const httpCodes = Object.keys(responseSchema)
    for (const code of httpCodes) {
      const schema = responseSchema[code]

      compiledResponseSchema[code] = ajv.compile(schema)
    }
  }

  return (req, res, next) => {
    res.payload = { data: null, errors: [], ...res.payload }
    res.payload = Flatted.parse(Flatted.stringify(res.payload))

    const statusCode = res.statusCode || req?.context?.statusCode || StatusCodes.OK

    const compiledSchema = compiledResponseSchema[statusCode] || compiledResponseSchema[`${statusCode.toString()[0]}xx`] || compiledResponseSchema.default

    if (compiledSchema) {
      if (compiledSchema(res.payload?.data)) {
        res.status(statusCode).json({ ...res.payload })
      } else {
        const errors = ajv.errorsText(compiledSchema.errors, { separator: ' ||||| ' }).split(' ||||| ')
        const responseValidationError = new ResponseValidationError({ errors })
        next(responseValidationError)
      }
    } else {
      res.status(statusCode).json({ ...res.payload })
    }
  }
}
