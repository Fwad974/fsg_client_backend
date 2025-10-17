'use strict'

import { USER_TYPES } from '../../libs/constants'

export default (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    actioneeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    corporateId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'corporate_id'
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0.0
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comments: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    moreDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    paymentMethodId: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'payment_transactions',
    schema: 'public',
    timestamps: true
  })

  PaymentTransaction.associate = models => {
    PaymentTransaction.belongsTo(models.Individual, {
      foreignKey: 'IndividualId',
      as: 'individual',
    })

    PaymentTransaction.belongsTo(models.Corporate, {
      foreignKey: 'corporateId',
      as: 'corporate'
    })
  }

  return PaymentTransaction
}
