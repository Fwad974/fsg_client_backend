import localize from 'ajv-i18n'
import SocketRequestInputValidationError from '../../errors/socketRequestInputValidation.error'
import ajv from '../../libs/ajv'
import { getLocalizedError } from '../../utils/error.utils'

/**
 *
 *
 * @export
 * @param {[string, import('./contextSocket.middleware').SocketRequestData, function]} args
 * @param {function} next
 * If schema is there it will get the schema and validate the if data is not valid it will pass the error
 * to the client if resCallback is available and pass the error to the next middleware
 */
export default function requestValidationSocketMiddleware (args, next) {
  const [eventName, requestData, resCallback] = args

  const { payload, context } = requestData

  const req = context?.socket?.request

  const compiledPayloadSchema = context?.schemas?.request

  const errorPayload = {}
  let error = false

  if (!compiledPayloadSchema) {
    next()
    return
  }

  const locale = req.locale.split('-')[0]

  if (!compiledPayloadSchema(payload)) {
    error = true
    localize[locale](compiledPayloadSchema.errors)
    errorPayload.payload = ajv.errorsText(compiledPayloadSchema.errors, { separator: ' ||||| ' }).split(' ||||| ')
  }

  if (!error) {
    next()
    return
  }

  const validationError = new SocketRequestInputValidationError(errorPayload)

  context?.logger.error('SocketRequestInputValidationError' + ` In namespace ${context?.socket?.nsp.name} event name ${eventName}`, {
    message: validationError.message,
    fault: {
      payload
    }
  })

  const localizedError = getLocalizedError(validationError, req.__)

  resCallback({
    errors: [localizedError],
    data: {}
  })

  next(validationError)
}
