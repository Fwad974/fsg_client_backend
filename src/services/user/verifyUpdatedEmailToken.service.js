import _ from 'lodash'
import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import { getCachedData } from '../../helpers/redis.helpers'

const schema = {
  type: 'object',
  properties: {
    OTP: {
      type: 'string'
    }
  },
  required: ['OTP']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to verify email token
 * @export
 * @class VerifyEmailOtpService
 * @extends {ServiceBase}
 */
export default class VerifyEmailOtpService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: {
        User: UserModel
      },
      auth: { id: userId },
      sequelizeTransaction,
      ipAddress,
      userAgent
    } = this.context

    let userData = await getCachedData(userId)

    if (!userData) {
      return this.addError('OtpNotInCacheErrorType')
    }

    userData = JSON.parse(userData)
    if (userData.OTP !== this.args.OTP) {
      return this.addError('OtpIncorrectErrorType')
    }

    const optionalFields = _.omitBy({
      firstName: userData.firstName,
      lastName: userData.lastName
    }, _.isNil)

    const fieldsToUpdate = {
      emailVerified: true,
      verifiedAt: Date.now(),
      email: userData.email,
      ...optionalFields
    }

    await UserModel.update(fieldsToUpdate, {
      where: { id: userId },
      transaction: sequelizeTransaction
    })

    const updatedUser = await UserModel.findOne({
      attributes: ['id', 'uuid', 'email', 'verifiedAt'],
      where: { id: userId },
      raw: true,
      transaction: sequelizeTransaction
    })

    EmailVerifiedEventService.execute({
      uuid: String(updatedUser.uuid),
      email: String(updatedUser.email),
      urmIp: String(ipAddress),
      userAgent: String(userAgent)
    })

    ProfileUpdateEventService.execute({
      uuid: String(updatedUser.uuid),
      email: String(updatedUser.email),
      userId: String(updatedUser.id),
      emailVerifiedAt: updatedUser.verifiedAt ? toIsoWithOffset(updatedUser.verifiedAt) : undefined,
      urmIp: String(ipAddress),
      userAgent: String(userAgent)
    })

    return { message: 'User email verified', email: userData.email }
  }
}
