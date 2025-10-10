'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      const clinics = [
        {
          category_id: 1,
          name: 'City Health Clinic',
          address: '123 Main St, New York, NY 10001',
          phone: '+1234567910',
          created_at: now,
          updated_at: now
        },
        {
          category_id: 1,
          name: 'Downtown Medical Center',
          address: '456 Broadway, Los Angeles, CA 90001',
          phone: '+1234567911',
          created_at: now,
          updated_at: now
        },
        {
          category_id: 2,
          name: 'Heart Care Institute',
          address: '789 Cardiac Ave, Chicago, IL 60601',
          phone: '+1234567912',
          created_at: now,
          updated_at: now
        },
        {
          category_id: 2,
          name: 'Advanced Cardiology Center',
          address: '321 Heart Blvd, Houston, TX 77001',
          phone: '+1234567913',
          created_at: now,
          updated_at: now
        },
        {
          category_id: 3,
          name: 'Kids Health Clinic',
          address: '555 Children Way, Miami, FL 33101',
          phone: '+1234567914',
          created_at: now,
          updated_at: now
        },
        {
          category_id: 4,
          name: 'Bone & Joint Specialists',
          address: '888 Ortho Street, Seattle, WA 98101',
          phone: '+1234567915',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('clinics', clinics, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('clinics', null, {});
  }
};
