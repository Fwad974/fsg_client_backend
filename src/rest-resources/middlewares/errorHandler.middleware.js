import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { InternalServerErrorType } from '../../libs/errorTypes'
import { getLocalizedError, isTrustedError } from '../../utils/error.utils'
import { v4 as uuidv4 } from 'uuid' // Importing uuid to generate unique request IDs
import Logger from '../../../src/libs/logger'

/**
 *
 * @memberof Rest Middleware
 * @export
 * @name errorHandlerMiddleware
 * @param {*} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default function errorHandlerMiddleware (err, req, res, next) {
  let errorsAreTrusted = true
  let responseStatusCode
  const responseErrors = []

  if (!(err instanceof Array)) {
    err = [err]
  }

  const localizedInternalServerErrorType = getLocalizedError(InternalServerErrorType, res.__)
  const start = Date.now()
  if (err instanceof Array && !_.isEmpty(err)) {
    // const start = Date.now()
    const requestId = uuidv4()

    req.id = requestId

    res.setHeader('X-Request-Id', req.id)

    // Log the request

    Logger.info('Request:', {
      message: `Body: ${JSON.stringify(req.body)}`,
      headers: req.headers,
      body: req.body
    })

    // Capture the response status and time taken
    res.on('finish', () => {
      const duration = Date.now() - start
      // const duration = Date.now() - start
      Logger.info('Response:', {
        message: `StatusCode: ${res.statusCode} | Body: ${JSON.stringify(res.body)} | Duration: ${duration} ms`,
        headers: res.getHeaders()
      })
    })

    err.forEach(error => {
      req?.context?.logger.error(
        (error.name || InternalServerErrorType.name) + `In ${req.path}`,
        {
          message: error.message || error.description,
          context: {
            traceId: req?.context?.traceId,
            query: req.query,
            params: req.params,
            body: req.body
          },
          fault: error.fields
        })

      if (!isTrustedError(error)) {
        errorsAreTrusted = false
      }

      responseStatusCode = error.statusCode

      const localizedError = getLocalizedError(error, res.__)

      responseErrors.push(localizedError)
    })
  } else {
    req?.context?.logger.error(
      err.name || InternalServerErrorType.name + `In ${req.path}`,
      {
        message: 'Empty errors array passed',
        context: { traceId: req?.context?.traceId }
      })
  }

  if (errorsAreTrusted) {
    res.status(responseStatusCode || StatusCodes.BAD_REQUEST).send({ data: {}, errors: responseErrors })
  } else {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({
        data: {},
        errors: [{
          traceId: req?.context?.traceId,
          ...localizedInternalServerErrorType
        }]
      })
  }

  next()
}
