'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const categories = [
        {
          name: 'General Practice',
          description: 'Primary healthcare services',
          created_at: now,
          updated_at: now
        },
        {
          name: 'Cardiology',
          description: 'Heart and cardiovascular care',
          created_at: now,
          updated_at: now
        },
        {
          name: 'Pediatrics',
          description: 'Healthcare for children',
          created_at: now,
          updated_at: now
        },
        {
          name: 'Orthopedics',
          description: 'Bone and joint care',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('categories', categories, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
