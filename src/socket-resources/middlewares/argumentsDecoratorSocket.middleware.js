import InvalidSocketArgumentError from '../../errors/InvalidSocketArgument.error'
import { getLocalizedError } from '../../utils/error.utils'

/**
 *
 *
 * @export
 * @param {Array} args
 * @param {function} next
 * It will make sure that whenever we receive data it will be in proper format
 * like eventName, [payload] and [callback]
 * If the args is not in proper order then it will raise error, it will always expect the event to be on first place
 * and no more than 3 arguments
 */

export default function argumentsDecoratorSocketMiddleware (socket) {
  const req = socket?.request

  return (args, next) => {
    if (args.length > 3 || (args[2] && typeof args[2] !== 'function')) {
      const invalidPayloadError = new InvalidSocketArgumentError({
        payload: args
      })

      if (typeof args[args.length - 1] === 'function') {
        const localizedError = getLocalizedError(invalidPayloadError, req.__)
        args[args.length - 1]({ data: {}, errors: [localizedError] })
      }

      next(invalidPayloadError)
      return
    }

    if (typeof args[1] === 'function') {
      args[2] = args[1]
      args[1] = {}
    }

    next()
  }
}
