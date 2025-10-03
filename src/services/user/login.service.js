import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ajv from '../../libs/ajv'
import config from '../../configs/app.config'
import ServiceBase from '../../libs/serviceBase'
import { setData } from '../../helpers/redis.helpers'
import { getUserTokenCacheKey } from '../../utils/user.utils'
import UserRepository from '../../infrastructure/repositories/userRepository'
import GenerateVerificationCodeService from '../phone/generateVerificationCode.service'
import { TOKEN_TYPE } from '../../libs/constants'
import Logger from '../../libs/logger'

const schema = {
  type: 'object',
  properties: {
    userNameOrPhone: { type: 'string' },
    password: { type: 'string' },
    userToken: { type: 'number' }
  },
  required: ['userNameOrPhone', 'password']
}

const constraints = ajv.compile(schema)

/**
 * it provides service of login for a user
 * @export
 * @class LoginService
 * @extends {ServiceBase}
 */
export default class LoginService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction
    } = this.context

    Logger.info('LoginService: ', { message: 'this is the this.args', context: { args: JSON.stringify(this.args) } })

    const userObj = {
      userNameOrPhone: this.args.userNameOrPhone?.trim()?.toLowerCase?.(),
      password: this.args.password?.trim(),
      userToken: this.args.userToken
    }

    const user = await UserRepository.findByUserNameOrPhone(userObj.userNameOrPhone, { attributes: ['id', 'encryptedPassword', 'phone', 'userName', 'signInCount', 'phoneVerified', 'uuid', 'firstName', 'lastName', 'email'] })
    Logger.info('LoginService: ', { message: 'this is the user', context: { user: JSON.stringify(user) } })

    if (!user) return this.addError('UserNotExistsErrorType')

    if (!user.encryptedPassword) {
      return this.addError('PasswordExpired', 'Password expired, please reset it.')
    }

    const isPasswordValid = await this.isValidPassword(user.encryptedPassword, userObj.password)
    if (!isPasswordValid) {
      return this.addError('InvalidCredentialsErrorType', 'Wrong Password')
    }

    if (!user.phoneVerified) {
      await GenerateVerificationCodeService.run({ phoneNumber: user.phone, userId: user.id, userName: user.userName, tokenType: TOKEN_TYPE.phone }, this.context)

      return this.addError('PhoneNotVerifiedErrorType', `phone number of ${userObj.userNameOrEmail} is not verified, please check your sms delivery.`)
    }

    const userUpdateObject = {
      signInCount: user.signInCount + 1,
      lastLogin: Date.now()
    }

    await UserRepository.update(user.id, userUpdateObject, sequelizeTransaction)

    const accessToken = await jwt.sign(
      { id: user.id, phone: user.phone },
      config.get('jwt.loginTokenSecret'),
      { expiresIn: config.get('jwt.loginTokenExpiry') }
    )

    // set token in redis
    const cacheTokenKey = getUserTokenCacheKey(user.id)
    setData(cacheTokenKey, accessToken, config.get('jwt.loginTokenExpiry'))


    return { message: 'Authentication successful', accessToken, user }
  }

  async isValidPassword (encryptedPassword, inputPassword) {
    try {
      const passwordMatches = await bcrypt.compare(inputPassword, encryptedPassword)

      if (passwordMatches) return true
    } catch (error) {
      Logger.error('Login: ', { message: `isValidPassword: Password validation error: ${error.message}`, exception: error })

      return false
    }
  }
}
