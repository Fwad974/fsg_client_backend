'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const payments = [
        {
          user_id: 7,
          corporate_id: 1,
          account_number: '4532********1234',
          created_at: now,
          updated_at: now
        },
        {
          user_id: 8,
          corporate_id: 2,
          account_number: '5555********4444',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('payments', payments, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('payments', {
      user_id: [7, 8]
    }, {});
  }
};
