'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_tokens', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'token'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'user_id'
      },
      tokenType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'token_type'
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
    await queryInterface.dropTable('user_tokens');
  }
};
