import UserRepository from '../../infrastructure/repositories/userRepository'
import UserRoleRepository from '../../infrastructure/repositories/userRoleRepository'
import bcrypt from 'bcrypt'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import { SALT_ROUNDS } from '../../libs/constants'
import GenerateVerificationCodeService from '../generateCode/generateVerificationCode.service'
import { TOKEN_TYPE, USER_TYPES, USER_ROLE_TYPE } from '../../libs/constants'
import _ from 'lodash'

const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', pattern: '^[ ]*(\\S[\\s\\S]*\\S)[ ]*$' },
    lastName: { type: 'string', pattern: '^[ ]*(\\S[\\s\\S]*\\S)[ ]*$' },
    email: { type: 'string' },
    phone: {
      type: 'string',
      pattern: '^\\+?[0-9]{10,15}$',
      minLength: 10,
      maxLength: 16
    },
    phoneCode: { type: 'string' },
    password: {
      type: 'string',
      pattern: '^[A-Za-z0-9\\-~#^()\\[\\]{}"\':;<,>.\\|!@*$]{5,50}$',
      minLength: 5
    },
    userName: { type: 'string' },
    // userType: {
    //   type: "string",
    //   enum: ["individual", "corporate", "doctor"]
    // }
  },
  required: ['phone', 'password', 'userName', 'firstName', 'lastName']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to signup the user
 * @export
 * @class SignupService
 * @extends {ServiceBase}
 */
export default class SignupService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      logger
    } = this.context

    logger.info('SignupService: ', { message: 'this is the this.args', context: { args: JSON.stringify(this.args) } })

    const userObj = {
      firstName: this.args.firstName?.trim(),
      lastName: this.args.lastName?.trim(),
      email: this.args?.email?.toLowerCase?.().trim(),
      userName: this.args?.userName?.toLowerCase?.().trim(),
      userType: USER_TYPES.INDIVIDUAL,
      phone: this.args?.phone
    }
    let newUser

    const userExists = await UserRepository.findByUserNameAndPhone(userObj.userName, userObj.phone, { attributes: ['id'] })
    logger.info('SignupService: ', { message: 'this is the userExists', context: { userExists: JSON.stringify(userExists) } })

    if (userExists) return this.addError('UserNameOrPhoneAlreadyTakenErrorType')

    try {
      userObj.encryptedPassword = await bcrypt.hash(
        this.args.password,
        SALT_ROUNDS
      )

      const userRole = await UserRoleRepository.findByRoleType(USER_ROLE_TYPE.INDIVIDUAL, { attributes: ['id', 'roleType'] })
      logger.info('SignupService: ', { message: 'this is the userRole', context: { userRole: JSON.stringify(userRole) } })

      userObj.userRoleId = userRole.id

      const filteredUserObject = _.omitBy(userObj, _.isNil)
      logger.info('SignupService: ', { message: 'this is the filteredUserObject', context: { filteredUserObject: JSON.stringify(filteredUserObject) } })

      newUser = await UserRepository.create(filteredUserObject, sequelizeTransaction)
    } catch (error) {
      logger.error('SignupService: ', { message: `catch error message ${error.message}`, exception: error })

      return this.addError('SomethingWentWrongErrorType')
    }

    logger.info('SignupService: ', { message: 'this is the newUser', context: { newUser: JSON.stringify(newUser) } })

    await GenerateVerificationCodeService.run({ phoneNumber: newUser.phone, userId: newUser.id, userName: newUser.userName, tokenType: TOKEN_TYPE.phone }, this.context)

    return { message: 'Account created successfully. Please check your phone and enter the verification code to complete registration.', uuid: newUser.uuid }
  }
}
