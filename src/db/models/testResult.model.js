'use strict'

import { USER_TYPES } from '../../libs/constants'

export default (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
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
      field: 'user_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_stack'
    },
    errorType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'error_type'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    suiteName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'suite_name'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_path'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'full_name'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'tags'
    },
    assertionResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'assertion_result'
    },
    stdout: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'stdout'
    },
    stderr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'stderr'
    },
    retryAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'retry_attempts'
    },
    expectedValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'expected_value'
    },
    actualValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'actual_value'
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
    tableName: 'test_results',
    schema: 'public',
    timestamps: true
  })

  TestResult.associate = models => {
    TestResult.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      scope: {
        userType: USER_TYPES.INDIVIDUAL
      }
    })
  }

  return TestResult
}
