import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'
import { SALT_ROUNDS } from '../../libs/constants'
import bcrypt from 'bcrypt'

const schema = {
  type: 'object',
  properties: {
    oldPassword: { type: 'string' },
    newPassword: {
      type: 'string',
      minLength: 5,
      pattern: '^[A-Za-z0-9\\-~#^()\\[\\]{}"\':;<,>.\\|!@*$]{5,50}$'
    }
  },
  required: ['oldPassword', 'newPassword']
}

const constraints = ajv.compile(schema)

/**
 * Provides service for the changePassword functionality
 * @export
 * @class ChangePasswordService
 * @extends {ServiceBase}
 */

export default class ChangePasswordService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      dbModels: { User: UserModel },
      auth: { id: userId },
      sequelizeTransaction
    } = this.context

    const currentUser = await UserModel.findOne({
      where: { id: userId },
      raw: true,
      transaction: sequelizeTransaction
    })

    const passwordMatch = await bcrypt.compare(
      this.args.oldPassword,
      currentUser.encryptedPassword
    )

    if (!passwordMatch) {
      return this.addError('InvalidCredentialsErrorType',
        `oldPassword: ${this.args.oldPassword}`
      )
    }

    const newEncryptedPassword = await bcrypt.hash(
      this.args.newPassword,
      SALT_ROUNDS
    )

    await UserModel.update(
      {
        encryptedPassword: newEncryptedPassword
      },
      {
        where: { id: currentUser.id },
        transaction: sequelizeTransaction
      }
    )
    return {
      message: 'Password Changed successfully'
    }
  }
}
