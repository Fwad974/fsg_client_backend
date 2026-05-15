'use strict'

export default (sequelize, DataTypes) => {
  const SampleDelivery = sequelize.define('SampleDelivery', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'hospital_id'
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
    tableName: 'sample_deliveries',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  return SampleDelivery
}
