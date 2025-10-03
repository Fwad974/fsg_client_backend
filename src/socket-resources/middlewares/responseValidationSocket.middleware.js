import Flatted from 'flatted'
import ajv from '../../libs/ajv'
import { InternalServerErrorType, SocketResponseValidationErrorType } from '../../libs/errorTypes'
import { getLocalizedError, isTrustedError } from '../../utils/error.utils'

/**
 *
 *
 * @export
 * @param {import('./contextSocket').SocketContext} context
 * @param {string} event
 * @param {function} acknowledgeCallback
 * @param {Object} payload
 * It will first validate the data if schema is present
 * If there is any error while validating the schemas it will log error and return InternalServerError
 * Also it will always send response in { data: {}, errors: [] } form
 * It will call the acknowledgeCallback with payload if acknowledgeCallback is present otherwise complete the call
 */
export default function responseValidationSocketMiddleware (context, event, acknowledgeCallback, payload) {
  if (!acknowledgeCallback) {
    return
  }

  const req = context?.socket?.request

  payload = { data: null, errors: [], ...payload }

  payload = Flatted.parse(Flatted.stringify(payload))

  const localizedInternalServerErrorType = getLocalizedError(InternalServerErrorType, req.__)

  if (payload?.errors?.length) {
    let errorsAreTrusted = true

    const responseErrors = payload?.errors.map(error => {
      context?.logger.error(
        (error.name || InternalServerErrorType.name) + `In ${event}`,
        {
          message: error.message || error.description,
          exception: error,
          fault: error.fields
        })

      if (!isTrustedError(error)) {
        errorsAreTrusted = false
      }

      return getLocalizedError(error, req.__)
    })

    if (errorsAreTrusted) {
      acknowledgeCallback({ data: {}, errors: responseErrors })
    } else {
      acknowledgeCallback({
        data: {},
        errors: [{
          ...localizedInternalServerErrorType
        }]
      })
    }

    return
  }

  const compiledResponseSchema = context?.schemas?.response

  if (compiledResponseSchema) {
    if (compiledResponseSchema(payload.data)) {
      acknowledgeCallback(payload)
    } else {
      const errors = ajv.errorsText(compiledResponseSchema.errors, { separator: ' ||||| ' }).split(' ||||| ')

      context?.logger.error(SocketResponseValidationErrorType.name + ` In namespace ${context?.socket?.nsp.name} event name ${event}`, {
        message: SocketResponseValidationErrorType.description,
        fault: errors
      })

      const response = { data: {}, errors: [localizedInternalServerErrorType] }
      acknowledgeCallback(response)
    }
  } else {
    acknowledgeCallback(payload)
  }
}
