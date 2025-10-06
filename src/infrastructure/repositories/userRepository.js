import IUserRepository from '../../domain/repositories/IUserRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class UserRepository extends IUserRepository {
  static async findById (id, options = {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid']
    } = options

    return await UserModel.findByPk(id, { attributes, raw: true })
  }

  static async findByUserNameOrPhoneAndType (userNameOrPhone, userType, options = {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid', 'phone']
    } = options

    const whereCondition = {
      userType,
      [Op.or]: [
        {
          userName: userNameOrPhone
        },
        {
          phone: userNameOrPhone
        }
      ]
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      attributes,
      raw: true
    })

    return user
  }

  static async findByUserNameOrPhone (userNameOrPhone, options = {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid', 'phone']
    } = options

    const whereCondition = {
      [Op.or]: [
        {
          userName: userNameOrPhone
        },
        {
          phone: userNameOrPhone
        }
      ]
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      attributes,
      raw: true
    })

    return user
  }

  static async findByUserNameAndPhone (userName, phone, options = {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid', 'phone']
    } = options

    const whereCondition = {
      [Op.or]: [
        {
          userName
        },
        {
          phone
        }
      ]
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      attributes,
      raw: true
    })

    return user
  }

  static async findByPhone (phone, options= {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid', 'phone'],
      transaction
    } = options

    const user = await UserModel.findOne({
      where: { phone },
      attributes,
      transaction,
      raw: true
    })

    return user
  }

  static async findByPhoneOrUserNameAndNotVerify (userNameOrPhone, options= {}) {
    const { User: UserModel } = models

    const {
      attributes = ['id', 'uuid', 'phone'],
      transaction
    } = options

    const whereCondition = {
      phoneVerified: false,
      [Op.or]: [
        {
          userName: userNameOrPhone
        },
        {
          phone: userNameOrPhone
        }
      ]
    }

    const user = await UserModel.findOne({
      where: whereCondition,
      attributes,
      transaction,
      raw: true
    })

    return user
  }

  static async getUserByUUID (uuid, options = {}) {
    const { User: UserModel } = models

    const {
      userAttributes = ['id', 'active', 'uuid']
    } = options

    const user = await UserModel.findOne({
      where: { uuid },
      attributes: userAttributes,
      raw: true
    })

    return user
  }

  findByEmail (email) {
    // TODO: Implement findByEmail method
    const { User: UserModel } = models
    return UserModel.findOne({ where: { email } })
  }

  findByUsername (username) {
    // TODO: Implement findByUsername method
    const { User: UserModel } = models
    return UserModel.findOne({ where: { username } })
  }

  findByReferralCode (referralCode) {
    // TODO: Implement findByReferralCode method
    const { User: UserModel } = models
    return UserModel.findOne({ where: { referralCode } })
  }

  static async create (user, transaction) {
    const { User: UserModel } = models

    return await UserModel.create(user, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { User: UserModel } = models

    return UserModel.update(updateObject, { where: { id }, transaction })
  }
}
