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
      individualId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'individual_id',
        comment: 'References individuals.id - Test always belongs to an individual'
      },
      corporateId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        field: 'corporate_id',
        comment: 'Optional - Corporate associated with this test'
      },
      doctorId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        field: 'doctor_id',
        comment: 'Optional - Doctor associated with this test'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'status'
      },
      sample: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'sample'
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
