'use strict'

export default (sequelize, DataTypes) => {
  const TestAlert = sequelize.define('TestAlert', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    testResultId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'test_result_id'
    },
    alertType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'alert_type'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at'
    },
    acknowledgedByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'acknowledged_by_user_id'
    },
    downloadAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'download_acknowledged_at'
    },
    downloadAcknowledgedByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'download_acknowledged_by_user_id'
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
    tableName: 'test_alerts',
    schema: 'public',
    timestamps: true
  })

  TestAlert.associate = models => {
    TestAlert.belongsTo(models.TestResult, {
      foreignKey: 'testResultId',
      as: 'testResult'
    })
  }

  return TestAlert
}
