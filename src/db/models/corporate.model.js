'use strict'

export default (sequelize, DataTypes) => {
  const Corporate = sequelize.define('Corporate', {
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
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'company_name'
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'industry'
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
    tableName: 'corporates',
    schema: 'public',
    timestamps: true
  })

  Corporate.associate = models => {
    Corporate.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })

    Corporate.hasOne(models.Payment, {
      foreignKey: 'corporateId',
      as: 'payment'
    })

    Corporate.belongsToMany(models.Individual, {
      through: 'individual_corporates',
      foreignKey: 'corporateId',
      otherKey: 'individualId',
      as: 'individuals'
    })

    Corporate.belongsToMany(models.Doctor, {
      through: 'corporate_doctors',
      foreignKey: 'corporateId',
      otherKey: 'doctorId',
      as: 'doctors'
    })

    Corporate.hasMany(models.TestResult, {
      foreignKey: 'corporateId',
      as: 'testResults'
    })

    Corporate.hasMany(models.PaymentTransaction, {
      foreignKey: 'corporateId',
      as: 'paymentTransactions'
    })
  }

  return Corporate
}
