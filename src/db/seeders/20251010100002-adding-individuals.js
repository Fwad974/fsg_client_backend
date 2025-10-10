'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const individuals = [
        {
          user_id: 1,
          date_of_birth: new Date('1990-05-15'),
          gender: 'male',
          created_at: now,
          updated_at: now
        },
        {
          user_id: 2,
          date_of_birth: new Date('1985-08-22'),
          gender: 'female',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('individuals', individuals, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('individuals', {
      user_id: [1, 2]
    }, {});
  }
};
