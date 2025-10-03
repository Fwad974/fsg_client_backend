import IUserTokenRepository from '../../domain/repositories/IUserTokenRepository'
import models from '../../db/models'

export default class UserTokenRepository extends IUserTokenRepository {
  static async findById (id, options = {}) {
    const { UserToken: UserTokenModel } = models

    const {
      attributes = ['id', 'token', 'userId', 'tokenType'],
      transaction
    } = options

    return await UserTokenModel.findByPk(id, { attributes, transaction, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { UserToken: UserTokenModel } = models

    const {
      attributes = ['id', 'token', 'userId', 'tokenType'],
      transaction
    } = options

    return await UserTokenModel.findOne({ where: { userId }, attributes, transaction, raw: true })
  }

  static async findByUserIdAndTokenType (userId, tokenType, options = {}) {
    const { UserToken: UserTokenModel } = models

    const {
      attributes = ['id', 'token', 'userId', 'tokenType'],
      transaction
    } = options

    return await UserTokenModel.findOne({ where: { userId, tokenType }, attributes, transaction, raw: true })
  }

  static async findByToken (token, options = {}) {
    const { UserToken: UserTokenModel } = models

    const {
      attributes = ['id', 'token', 'userId', 'tokenType'],
      transaction
    } = options

    return await UserTokenModel.findOne({ where: { token }, attributes, transaction, raw: true })
  }

  static async findByTokenAndType (token, tokenType, options = {}) {
    const { UserToken: UserTokenModel } = models

    const {
      attributes = ['id', 'token', 'userId', 'tokenType'],
      transaction
    } = options

    return await UserTokenModel.findOne({ where: { token, tokenType }, attributes, transaction, raw: true })
  }

  static async create (createObject, transaction) {
    const { UserToken: UserTokenModel } = models

    return await UserTokenModel.create(createObject, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { UserToken: UserTokenModel } = models

    return await UserTokenModel.update(updateObject, { where: { id }, transaction })
  }

  static async destroy (id, transaction) {
    const { UserToken: UserTokenModel } = models

    return await UserTokenModel.destroy({ where: { id }, transaction })
  }
}
