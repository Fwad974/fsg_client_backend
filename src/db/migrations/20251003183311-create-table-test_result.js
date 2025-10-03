'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('test_results', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'user_id'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        field: 'status'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'duration'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_message'
      },
      errorStack: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_stack'
      },
      errorType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'error_type'
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'start_time'
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'end_time'
      },
      suiteName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'suite_name'
      },
      filePath: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'file_path'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'full_name'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        field: 'tags'
      },
      assertionResult: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'assertion_result'
      },
      stdout: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'stdout'
      },
      stderr: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'stderr'
      },
      retryAttempts: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'retry_attempts'
      },
      expectedValue: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'expected_value'
      },
      actualValue: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'actual_value'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    }, {
      schema: 'public',
      timestamps: true,
      underscored: true
    })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('test_results');
  }
};
