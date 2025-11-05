'use strict'

export default (sequelize, DataTypes) => {
  const TestCategory = sequelize.define('TestCategory', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    testCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'test_code'
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'test_name'
    },
    tat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'tat'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    testCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'test_category'
    },
    specimenType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'specimen_type'
    },
    transportationTemperature: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'transportation_temperature'
    },
    methodology: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'methodology'
    },
    priceB2C: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'price_b2c'
    },
    thresholdPrice: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'threshold_price'
    },
    priceB2B: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'price_b2b'
    },
    priceLessThan20: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'price_less_than_20'
    },
    price20To40: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'price_20_to_40'
    },
    priceMoreThan40: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'price_more_than_40'
    },
    serviceCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'service_category'
    },
    referralLab: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referral_lab'
    },
    referralLabTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referral_lab_tat'
    },
    baseCost: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'base_cost'
    },
    proposedInternalTat: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'proposed_internal_tat'
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
    tableName: 'test_categories',
    schema: 'public',
    timestamps: true
  })

  return TestCategory
}
