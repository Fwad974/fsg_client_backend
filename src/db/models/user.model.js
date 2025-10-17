'use strict'

import { customAlphabet } from 'nanoid'
const customNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_', 8)

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    userRoleId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    encryptedPassword: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    profileImageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    signInCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    signInIp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'uuid'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    paranoid: true,
  })

  User.associate = models => {
    User.hasMany(models.PaymentTransaction, {
      foreignKey: 'actioneeId',
      as: 'paymentTransactions'
    })

    User.hasMany(models.UserToken, {
      foreignKey: 'userId'
    })

    User.hasMany(models.ContactRequest, {
      foreignKey: 'userId'
    })

    User.belongsTo(models.UserRole, {
      foreignKey: 'userRoleId',
      as: 'role'
    })

    User.hasOne(models.Individual, {
      foreignKey: 'userId',
      as: 'individualProfile'
    })

    User.hasOne(models.Corporate, {
      foreignKey: 'userId',
      as: 'corporateProfile'
    })

    User.hasOne(models.Doctor, {
      foreignKey: 'userId',
      as: 'doctorProfile'
    })

    User.hasOne(models.Payment, {
      foreignKey: 'userId',
      as: 'paymentProfile'
    })
  }

  User.beforeValidate((user) => {

    if (!user.uuid) {
      user.uuid = customNanoid()
    }
  })

  return User
}
