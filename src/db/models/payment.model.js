'use strict'

export default (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    corporateId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      field: 'corporate_id'
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_number'
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
    tableName: 'payments',
    schema: 'public',
    timestamps: true
  })

  Payment.associate = models => {
    Payment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })

    Payment.belongsTo(models.Corporate, {
      foreignKey: 'corporateId',
      as: 'corporate'
    })
  }

  return Payment
}
