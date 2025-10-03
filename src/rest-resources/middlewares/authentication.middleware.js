/**
 *
 * @namespace Rest Middleware
 */
import jwt from 'jsonwebtoken'
import config from '../../configs/app.config'
import { getCachedData } from '../../helpers/redis.helpers'
import { InvalidTokenErrorType } from '../../libs/errorTypes'
import { getUserTokenCacheKey } from '../../utils/user.utils'
import { requestContext } from '../../libs/winstonLogger'

/**
 *
 * @memberof Rest Middleware
 * @export
 * @name authenticationMiddleWare
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export default async function authenticationMiddleWare (req, res, next) {
  try {
    const jwtToken = req.headers.authorization?.split(' ')[1]

    if (!jwtToken) {
      return next(InvalidTokenErrorType)
    }

    let jwtDecoded = {}

    jwtDecoded = jwt.verify(jwtToken, config.get('jwt.loginTokenSecret'))

    req.context.auth = jwtDecoded || {}

    const cachedToken = await getCachedData(getUserTokenCacheKey(jwtDecoded.id))

    if (!cachedToken || cachedToken !== jwtToken) {
      return next(InvalidTokenErrorType)
    }

    // Update request context with authenticated user info
    requestContext.run({ req, headers: req.headers, context: req.context }, () => {
      next()
    })
  } catch (err) {
    req.context.logger.error('Error in authenticationMiddleware', {
      message: err.message,
      context: {
        traceId: req?.context?.traceId,
        query: req.query,
        params: req.params,
        body: req.body,
        headers: req.headers
      },
      exception: err
    })

    next(InvalidTokenErrorType)
  }
}
