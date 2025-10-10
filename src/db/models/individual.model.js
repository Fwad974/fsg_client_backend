'use strict'

export default (sequelize, DataTypes) => {
  const Individual = sequelize.define('Individual', {
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
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_of_birth'
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'gender'
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
    tableName: 'individuals',
    schema: 'public',
    timestamps: true
  })

  Individual.associate = models => {
    Individual.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })

    Individual.belongsToMany(models.Doctor, {
      through: 'individual_doctors',
      foreignKey: 'individualId',
      otherKey: 'doctorId',
      as: 'doctors'
    })

    Individual.belongsToMany(models.Corporate, {
      through: 'individual_corporates',
      foreignKey: 'individualId',
      otherKey: 'corporateId',
      as: 'corporates'
    })

    Individual.hasMany(models.TestResult, {
      foreignKey: 'individualId',
      as: 'testResults'
    })
  }

  return Individual
}
