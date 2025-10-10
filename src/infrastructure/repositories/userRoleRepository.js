import IUserRoleRepository from '../../domain/repositories/IUserRoleRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class UserRoleRepository extends IUserRoleRepository {
  static async findById (id, options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      transaction
    } = options

    return await UserRoleModel.findByPk(id, {
      attributes,
      transaction,
      raw: true
    })
  }

  static async findByRoleType (roleType, options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      transaction
    } = options

    return await UserRoleModel.findOne({
      where: { roleType },
      attributes,
      transaction,
      raw: true
    })
  }

  static async findByName (name, options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      transaction
    } = options

    return await UserRoleModel.findOne({
      where: { name },
      attributes,
      transaction,
      raw: true
    })
  }

  static async findAll (options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      where = {},
      order = [['id', 'ASC']],
      limit,
      offset,
      transaction
    } = options

    return await UserRoleModel.findAll({
      where,
      attributes,
      order,
      limit,
      offset,
      transaction,
      raw: true
    })
  }

  static async findAndCountAll (options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      where = {},
      order = [['id', 'ASC']],
      limit,
      offset,
      transaction
    } = options

    return await UserRoleModel.findAndCountAll({
      where,
      attributes,
      order,
      limit,
      offset,
      transaction,
      raw: true
    })
  }

  static async create (userRole, transaction) {
    const { UserRole: UserRoleModel } = models

    return await UserRoleModel.create(userRole, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { UserRole: UserRoleModel } = models

    return await UserRoleModel.update(updateObject, {
      where: { id },
      transaction
    })
  }

  static async delete (id, options = {}) {
    const { UserRole: UserRoleModel } = models

    const { transaction } = options

    return await UserRoleModel.destroy({
      where: { id },
      transaction
    })
  }

  static async findByPermission (permissionKey, options = {}) {
    const { UserRole: UserRoleModel } = models

    const {
      attributes = ['id', 'name', 'roleType', 'permission'],
      transaction
    } = options

    // Search for roles that contain the specified permission key in their JSONB permission field
    return await UserRoleModel.findAll({
      where: {
        permission: {
          [Op.contains]: { [permissionKey]: true }
        }
      },
      attributes,
      transaction,
      raw: true
    })
  }

  static async getUsersByRoleId (roleId, options = {}) {
    const { UserRole: UserRoleModel, User: UserModel } = models

    const {
      roleAttributes = ['id', 'name', 'roleType', 'permission'],
      userAttributes = ['id', 'uuid', 'userName', 'email', 'phone', 'active'],
      transaction
    } = options

    return await UserRoleModel.findByPk(roleId, {
      attributes: roleAttributes,
      include: [{
        model: UserModel,
        as: 'user',
        attributes: userAttributes
      }],
      transaction
    })
  }

  static async bulkCreate (userRoles, options = {}) {
    const { UserRole: UserRoleModel } = models

    const { transaction } = options

    return await UserRoleModel.bulkCreate(userRoles, {
      transaction,
      returning: true
    })
  }

  static async updatePermissions (id, permissions, options = {}) {
    const { UserRole: UserRoleModel } = models

    const { transaction } = options

    return await UserRoleModel.update(
      { permission: permissions },
      {
        where: { id },
        transaction
      }
    )
  }

  // Instance methods for interface compatibility
  findById (id) {
    return UserRoleRepository.findById(id)
  }

  findByRoleType (roleType) {
    return UserRoleRepository.findByRoleType(roleType)
  }

  findByName (name) {
    return UserRoleRepository.findByName(name)
  }

  findAll (options) {
    return UserRoleRepository.findAll(options)
  }

  create (userRole, transaction) {
    return UserRoleRepository.create(userRole, transaction)
  }

  update (id, userRole, transaction) {
    return UserRoleRepository.update(id, userRole, transaction)
  }

  delete (id) {
    return UserRoleRepository.delete(id)
  }

  findByPermission (permission) {
    return UserRoleRepository.findByPermission(permission)
  }

  getUsersByRoleId (roleId) {
    return UserRoleRepository.getUsersByRoleId(roleId)
  }
}