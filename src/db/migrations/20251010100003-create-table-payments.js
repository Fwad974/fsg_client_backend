'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
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
      corporateId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        field: 'corporate_id',
        comment: 'One-to-one relationship with corporate - Each payment belongs to exactly one corporate'
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'account_number'
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
    await queryInterface.dropTable('payments');
  }
};
