'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'user_role_id', {
      type: Sequelize.BIGINT,
      allowNull: true
    })
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'user_role_id');
  }
};
