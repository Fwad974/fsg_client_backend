'use strict';

import logger from '../../libs/logger'
import bcrypt from 'bcrypt'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      const users = [
        {
          user_role_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567890',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 5,
          sign_in_ip: '192.168.1.1',
          user_name: 'johndoe',
          country_code: 'US',
          last_login: now,
          user_type: 'individual',
          uuid: '550e8400-e29b-41d4-a716-446655440001',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 1,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567891',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 3,
          sign_in_ip: '192.168.1.2',
          user_name: 'janesmith',
          country_code: 'US',
          last_login: now,
          user_type: 'individual',
          uuid: '550e8400-e29b-41d4-a716-446655440002',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 2,
          first_name: 'Tech',
          last_name: 'Corp',
          email: 'info@techcorp.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567892',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 10,
          sign_in_ip: '192.168.1.3',
          user_name: 'techcorp',
          country_code: 'US',
          last_login: now,
          user_type: 'corporate',
          uuid: '550e8400-e29b-41d4-a716-446655440003',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 2,
          first_name: 'Health',
          last_name: 'Solutions',
          email: 'contact@healthsolutions.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567893',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 8,
          sign_in_ip: '192.168.1.4',
          user_name: 'healthsolutions',
          country_code: 'US',
          last_login: now,
          user_type: 'corporate',
          uuid: '550e8400-e29b-41d4-a716-446655440004',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 3,
          first_name: 'Dr. Sarah',
          last_name: 'Johnson',
          email: 'dr.sarah@medcenter.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567894',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 15,
          sign_in_ip: '192.168.1.5',
          user_name: 'drsarah',
          country_code: 'US',
          last_login: now,
          user_type: 'doctor',
          uuid: '550e8400-e29b-41d4-a716-446655440005',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 3,
          first_name: 'Dr. Michael',
          last_name: 'Chen',
          email: 'dr.michael@healthplus.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567895',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 12,
          sign_in_ip: '192.168.1.6',
          user_name: 'drmichael',
          country_code: 'US',
          last_login: now,
          user_type: 'doctor',
          uuid: '550e8400-e29b-41d4-a716-446655440006',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 4,
          first_name: 'Payment',
          last_name: 'TechCorp',
          email: 'payment@techcorp.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567904',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 2,
          sign_in_ip: '192.168.1.7',
          user_name: 'paymenttechcorp',
          country_code: 'US',
          last_login: now,
          user_type: 'payment',
          uuid: '550e8400-e29b-41d4-a716-446655440007',
          created_at: now,
          updated_at: now
        },
        {
          user_role_id: 4,
          first_name: 'Payment',
          last_name: 'HealthSolutions',
          email: 'payment@healthsolutions.com',
          email_verified: true,
          verified_at: now,
          encrypted_password: hashedPassword,
          phone: '+1234567905',
          phone_code: '+1',
          phone_verified: true,
          profile_image_url: null,
          sign_in_count: 1,
          sign_in_ip: '192.168.1.8',
          user_name: 'paymenthealthsolutions',
          country_code: 'US',
          last_login: now,
          user_type: 'payment',
          uuid: '550e8400-e29b-41d4-a716-446655440008',
          created_at: now,
          updated_at: now
        }
      ];

      await queryInterface.bulkInsert('users', users, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error('seed failed', { message: `catch error message: ${JSON.stringify(error.message)}`, exception: error });
      await transaction.rollback();
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', {
      uuid: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440006',
        '550e8400-e29b-41d4-a716-446655440007',
        '550e8400-e29b-41d4-a716-446655440008'
      ]
    }, {});
  }
};
