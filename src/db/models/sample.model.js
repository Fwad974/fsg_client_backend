'use strict'

export default (sequelize, DataTypes) => {
  const Sample = sequelize.define('Sample', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    sampleDeliveryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'sample_delivery_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'samples',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  Sample.associate = models => {
    Sample.belongsTo(models.SampleDelivery, {
      foreignKey: 'sampleDeliveryId',
      as: 'sampleDelivery'
    })
  }

  return Sample
}
