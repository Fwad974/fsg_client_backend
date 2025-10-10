'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const individualDoctors = [
        {
          individual_id: 1,
          doctor_id: 1,
          created_at: now,
          updated_at: now
        },
        {
          individual_id: 1,
          doctor_id: 2,
          created_at: now,
          updated_at: now
        },
        {
          individual_id: 2,
          doctor_id: 2,
          created_at: now,
          updated_at: now
        }
      ];

      const individualCorporates = [
        {
          individual_id: 1,
          corporate_id: 1,
          created_at: now,
          updated_at: now
        },
        {
          individual_id: 2,
          corporate_id: 2,
          created_at: now,
          updated_at: now
        },
        {
          individual_id: 2,
          corporate_id: 1,
          created_at: now,
          updated_at: now
        }
      ];

      const corporateDoctors = [
        {
          corporate_id: 1,
          doctor_id: 1,
          created_at: now,
          updated_at: now
        },
        {
          corporate_id: 1,
          doctor_id: 2,
          created_at: now,
          updated_at: now
        },
        {
          corporate_id: 2,
          doctor_id: 2,
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('individual_doctors', individualDoctors, { transaction });
      await queryInterface.bulkInsert('individual_corporates', individualCorporates, { transaction });
      await queryInterface.bulkInsert('corporate_doctors', corporateDoctors, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('individual_doctors', null, {});
    await queryInterface.bulkDelete('individual_corporates', null, {});
    await queryInterface.bulkDelete('corporate_doctors', null, {});
  }
};
