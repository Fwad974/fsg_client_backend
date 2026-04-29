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
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'uuid'
    },
    userRoleId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    accountType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_type'
    },
    patientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userName: {
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
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  User.associate = models => {
    User.belongsTo(models.UserRole, {
      foreignKey: 'userRoleId',
      as: 'role'
    })

    User.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })

    User.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })

    User.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })

    User.hasMany(models.UserToken, {
      foreignKey: 'userId'
    })

    User.hasMany(models.ContactRequest, {
      foreignKey: 'userId'
    })
  }

  User.beforeValidate((user) => {
    if (!user.uuid) {
      user.uuid = customNanoid()
    }
  })

  return User
}
