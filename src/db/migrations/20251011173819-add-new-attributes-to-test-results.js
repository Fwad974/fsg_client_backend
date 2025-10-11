'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('test_results', 'file_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('test_results', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('test_results', 'code', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('test_results', 'turn_around_time', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('test_results', 'file_url');
    await queryInterface.removeColumn('test_results', 'description');
    await queryInterface.removeColumn('test_results', 'code');
    await queryInterface.removeColumn('test_results', 'turn_around_time');
  }
};
