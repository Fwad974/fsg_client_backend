'use strict'

export default (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'license_number'
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'specialty'
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
    Doctor.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
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

  return Doctor
}
