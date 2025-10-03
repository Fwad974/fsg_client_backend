import { removeData } from '../../helpers/redis.helpers'
import ServiceBase from '../../libs/serviceBase'
import { getUserTokenCacheKey } from '../../utils/user.utils'
import UserRepository from '../../infrastructure/repositories/userRepository'

/**
 * Provides service to log the user out
 * @export
 * @class LogoutService
 * @extends {ServiceBase}
 */
export default class LogoutService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId }
    } = this.context

    const user = await UserRepository.findById(userId, { attributes: ['id', 'uuid'] })

    // delete token from redis
    const cacheTokenKey = getUserTokenCacheKey(user.id)
    removeData(cacheTokenKey)

    return { uuid: user.uuid, message: 'Logout successfully' }
  }
}
