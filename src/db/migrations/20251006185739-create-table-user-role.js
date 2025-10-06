'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      roleType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'role_type'
      },
      permission: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    }, {
      schema: 'public',
      underscored: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_roles', { schema: 'public' });
  }
};
