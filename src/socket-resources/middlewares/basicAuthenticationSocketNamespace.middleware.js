import config from '../../configs/app.config'
import { InvalidTokenErrorType } from '../../libs/errorTypes'

export default function basicAuthenticationSocketNamespaceMiddleware (socket, next) {
  const { auth } = socket.handshake

  if (!auth) {
    next(InvalidTokenErrorType)
  }

  const basicToken = auth?.basicToken?.replace('Basic ', '') || ''

  const [username, password] = Buffer.from(basicToken, 'base64').toString().split(':')

  if (username !== config.get('basic_auth.username') && password !== config.get('basic_auth.username')) {
    next(InvalidTokenErrorType)
    return
  }

  next()
}
