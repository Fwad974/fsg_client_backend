'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const doctors = [
        {
          user_id: 5,
          license_number: 'MD-12345-NY',
          specialty: 'Cardiology',
          created_at: now,
          updated_at: now
        },
        {
          user_id: 6,
          license_number: 'MD-67890-CA',
          specialty: 'General Practice',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('doctors', doctors, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('doctors', {
      user_id: [5, 6]
    }, {});
  }
};
