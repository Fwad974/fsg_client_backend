import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ajv from '../../libs/ajv'
import config from '../../configs/app.config'
import ServiceBase from '../../libs/serviceBase'
import { setData } from '../../helpers/redis.helpers'
import { getUserTokenCacheKey } from '../../utils/user.utils'
import { ACCOUNT_TYPE_TO_ROLE_TYPES } from '../../libs/constants'
import UserRepository from '../../infrastructure/repositories/userRepository'
import ValidateUserAccountLinkService from './validateUserAccountLink.service'

const schema = {
  type: 'object',
  properties: {
    userNameOrPhone: { type: 'string' },
    password:        { type: 'string' },
    accountType:     { type: 'string', enum: ['corporate', 'patient', 'doctor'] }
  },
  required: ['userNameOrPhone', 'password', 'accountType']
}

const constraints = ajv.compile(schema)

export default class LoginService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { sequelizeTransaction, logger } = this.context
    const { userNameOrPhone: rawIdentifier, password: rawPassword, accountType } = this.args

    const userNameOrPhone = rawIdentifier?.trim()?.toLowerCase?.()
    const password = rawPassword?.trim()
    const roleTypes = ACCOUNT_TYPE_TO_ROLE_TYPES[accountType]

    logger.info('LoginService: ', { message: 'Authenticating user against role-mapped accountType', context: { accountType: JSON.stringify(accountType), userNameOrPhone: JSON.stringify(userNameOrPhone) } })

    const user = await UserRepository.findByUserNameOrPhoneWithRoleIn(userNameOrPhone, roleTypes, {
      roleAttributes: ['id', 'name']
    })
    logger.info('LoginService: ', { message: 'this is the user:', context: { user: JSON.stringify(user) } })

    if (!user) return this.addError('UserNotExistsErrorType')
    if (!user.encryptedPassword) return this.addError('PasswordExpiredErrorType')

    const passwordOk = await this.isValidPassword(user.encryptedPassword, password)
    if (!passwordOk) return this.addError('InvalidCredentialsErrorType')

    const linkResult = await ValidateUserAccountLinkService.run({ accountType: user.accountType, hospitalId: user.hospitalId, doctorId: user.doctorId, patientId: user.patientId }, this.context)
    if (!linkResult) return this.addError('AccountNotLinkedErrorType')

    await UserRepository.update(user.id, { signInCount: user.signInCount + 1, lastLogin: new Date() }, sequelizeTransaction)

    const accessToken = jwt.sign({ id: user.id, phone: user.phone }, config.get('jwt.loginTokenSecret'), { expiresIn: config.get('jwt.loginTokenExpiry') })

    setData(getUserTokenCacheKey(user.id), accessToken, config.get('jwt.loginTokenExpiry'))

    logger.info('LoginService: ', { message: 'Token issued and cached for valid login', context: { userId: JSON.stringify(user.id), accountType: JSON.stringify(user.accountType) } })

    return { message: 'Authentication successful', accessToken, user }
  }

  async isValidPassword (encryptedPassword, inputPassword) {
    const { logger } = this.context
    try {
      return await bcrypt.compare(inputPassword, encryptedPassword)
    } catch (error) {
      logger.error('LoginService: ', { message: `bcrypt comparison failed: ${error.message}`, exception: error })
      return false
    }
  }
}
