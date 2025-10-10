'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clinics', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      categoryId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'category_id'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'address'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'phone'
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
    await queryInterface.dropTable('clinics');
  }
};
