'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('individuals', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
        comment: 'Same as users.id - One-to-one relationship'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        field: 'user_id',
        comment: 'Foreign key to users table'
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'date_of_birth'
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'gender'
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
    await queryInterface.dropTable('individuals');
  }
};
