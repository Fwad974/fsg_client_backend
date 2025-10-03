import jwt from 'jsonwebtoken'
import config from '../../configs/app.config'
import { getCachedData } from '../../helpers/redis.helpers'
import { InvalidTokenErrorType } from '../../libs/errorTypes'
import Logger from '../../libs/logger'
import { getUserTokenCacheKey } from '../../utils/user.utils'

export default async function authenticationSocketNamespaceMiddleWare (socket, next) {
  try {
    const { auth } = socket.handshake

    const jwtToken = auth.authorization?.split(' ')[1]

    if (!jwtToken) {
      next(InvalidTokenErrorType)
    }

    let jwtDecoded = {}

    jwtDecoded = jwt.verify(jwtToken, config.get('jwt.loginTokenSecret'))

    socket.auth = jwtDecoded || {}

    const cachedToken = await getCachedData(getUserTokenCacheKey(jwtDecoded.id))

    if (!cachedToken || cachedToken !== jwtToken) {
      next(InvalidTokenErrorType)
    }

    next()
  } catch (err) {
    Logger.error('Error in authenticationSocketMiddleware', {
      message: err.message,
      context: socket.handshake,
      exception: err
    })

    next(InvalidTokenErrorType)
  }
}
