'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const corporates = [
        {
          user_id: 3,
          company_name: 'Tech Corp Inc.',
          industry: 'Technology',
          created_at: now,
          updated_at: now
        },
        {
          user_id: 4,
          company_name: 'Health Solutions LLC',
          industry: 'Healthcare',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('corporates', corporates, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('corporates', {
      user_id: [3, 4]
    }, {});
  }
};
