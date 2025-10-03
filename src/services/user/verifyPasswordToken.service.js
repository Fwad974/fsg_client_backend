import { Op } from 'sequelize'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../libs/constants'
import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'

const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    token: {
      type: 'string'
    },
    password: { type: 'string' }
  },
  required: ['id', 'token', 'password']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to verify password token
 * @export
 * @class VerifyPasswordTokenService
 * @extends {ServiceBase}
 */
export default class VerifyPasswordTokenService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: { User: UserModel, UserToken: UserTokenModel },
      sequelizeTransaction
    } = this.context
    const userObj = {
      id: this.args.id,
      password: this.args.password,
      token: this.args.token
    }
    const currentDate = new Date()
    const expirationDate = new Date(
      currentDate.setHours(currentDate.getHours() - 3)
    )
    const validToken = await UserTokenModel.findOne({
      where: {
        [Op.and]: [
          { userId: userObj.id },
          { tokenType: 'passwordReset' },
          { token: userObj.token },
          { updatedAt: { [Op.gt]: expirationDate } }
        ]
      },
      transaction: sequelizeTransaction
    })

    if (!validToken) {
      return this.addError(
        'InvalidVerificationTokenErrorType',
        'Token is Expired or not valid'
      )
    }
    const user = await UserModel.findOne({
      where: {
        id: userObj.id
      },
      transaction: sequelizeTransaction
    })

    await UserTokenModel.destroy({
      where: {
        [Op.and]: [
          { userId: userObj.id },
          { token: userObj.token },
          { tokenType: 'passwordReset' }
        ]
      },
      transaction: sequelizeTransaction
    })
    if (!user) {
      return this.addError('UserNotExistsErrorType', 'User not found')
    }

    const newHashedPassword = await bcrypt.hash(userObj.password, SALT_ROUNDS)
    await UserModel.update(
      { encryptedPassword: newHashedPassword },
      {
        where: {
          id: user.id
        },
        transaction: sequelizeTransaction
      }
    )

    return { message: 'Password reset successfully', email: user.email }
  }
}
