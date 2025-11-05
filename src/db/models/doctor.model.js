'use strict'

import { customAlphabet } from 'nanoid'
const customNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_', 8)

export default (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'license_number'
    },
    clinicianName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'clinician_name'
    },
    clinicianPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'clinician_phone_number'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email'
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'specialty'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'uuid'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'doctors',
    schema: 'public',
    timestamps: true
  })

  Doctor.associate = models => {
    Doctor.hasMany(models.User, {
      foreignKey: 'doctorId',
      as: 'users'
    })

    Doctor.belongsToMany(models.Individual, {
      through: 'individual_doctors',
      foreignKey: 'doctorId',
      otherKey: 'individualId',
      as: 'individuals'
    })

    Doctor.belongsToMany(models.Corporate, {
      through: 'corporate_doctors',
      foreignKey: 'doctorId',
      otherKey: 'corporateId',
      as: 'corporates'
    })

    Doctor.hasMany(models.TestResult, {
      foreignKey: 'doctorId',
      as: 'testResults'
    })
  }

  Doctor.beforeValidate((doctor) => {
    if (!doctor.uuid) {
      doctor.uuid = customNanoid()
    }
  })

  return Doctor
}
