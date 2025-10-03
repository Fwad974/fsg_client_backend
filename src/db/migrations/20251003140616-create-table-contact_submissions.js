'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contact_requests', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'email'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'address'
      },
      contactNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'contact_number'
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'organization'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'message'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        allowNull: false,
        field: 'status'
      },
      requestId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'request_id'
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'responded_at'
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
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('contact_requests');
  }
};
