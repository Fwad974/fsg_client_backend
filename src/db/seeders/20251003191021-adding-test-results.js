// seeders/<timestamp>-test-results-user-1-2.js (Example filename)
'use strict';

import logger from '../../libs/logger'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const transaction = await queryInterface.sequelize.transaction();

   try {
    const now = new Date();

    const testResultsIndividual1 = [
      {
        individual_id: 1,
        corporate_id: null,
        doctor_id: null,
        name: 'Complete Blood Count (CBC)',
        status: 'passed',
        sample: 'blood',
        duration: 125,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 10000),
        end_time: new Date(now - 9875),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 1,
        corporate_id: null,
        doctor_id: null,
        name: 'Lipid Panel',
        status: 'failed',
        sample: 'blood',
        duration: 89,
        error_message: 'Sample hemolyzed, requires recollection',
        error_type: 'SampleError',
        start_time: new Date(now - 5000),
        end_time: new Date(now - 4911),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 1,
        corporate_id: null,
        doctor_id: null,
        name: 'Urinalysis',
        status: 'passed',
        sample: 'urine',
        duration: 1500,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 25000),
        end_time: new Date(now - 23500),
        created_at: now,
        updated_at: now
      }
    ];

    const testResultsIndividual2 = [
      {
        individual_id: 2,
        corporate_id: null,
        doctor_id: null,
        name: 'Thyroid Function Test',
        status: 'passed',
        sample: 'blood',
        duration: 2105,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 15000),
        end_time: new Date(now - 12895),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 2,
        corporate_id: null,
        doctor_id: null,
        name: 'Hemoglobin A1C',
        status: 'passed',
        sample: 'blood',
        duration: 800,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 8000),
        end_time: new Date(now - 7200),
        created_at: now,
        updated_at: now
      }
    ];

    const testResultsCorporate1 = [
      {
        individual_id: 2,
        corporate_id: 1,
        doctor_id: null,
        name: 'Employee Wellness Screening - Batch 1',
        status: 'passed',
        sample: 'blood',
        duration: 3200,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 22000),
        end_time: new Date(now - 18800),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 2,
        corporate_id: 1,
        doctor_id: null,
        name: 'Drug Screening Panel',
        status: 'passed',
        sample: 'urine',
        duration: 500,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 20000),
        end_time: new Date(now - 19500),
        created_at: now,
        updated_at: now
      }
    ];

    const testResultsCorporate2 = [
      {
        individual_id: 1,
        corporate_id: 2,
        doctor_id: null,
        name: 'Annual Health Assessment',
        status: 'passed',
        sample: 'blood',
        duration: 1200,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 4000),
        end_time: new Date(now - 2800),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 1,
        corporate_id: 2,
        doctor_id: null,
        name: 'Flu Vaccination Documentation',
        status: 'skipped',
        sample: 'blood',
        duration: 0,
        error_message: 'Vaccination season not yet started',
        error_type: null,
        start_time: new Date(now - 8000),
        end_time: new Date(now - 8000),
        created_at: now,
        updated_at: now
      }
    ];

    const testResultsDoctor1 = [
      {
        individual_id: 1,
        corporate_id: null,
        doctor_id: 1,
        name: 'ECG Analysis Quality Check',
        status: 'passed',
        sample: 'tissue',
        duration: 30000,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 40000),
        end_time: new Date(now - 10000),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 2,
        corporate_id: null,
        doctor_id: 1,
        name: 'Cardiac Enzyme Panel',
        status: 'passed',
        sample: 'blood',
        duration: 200,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 15000),
        end_time: new Date(now - 14800),
        created_at: now,
        updated_at: now
      }
    ];

    const testResultsDoctor2 = [
      {
        individual_id: 1,
        corporate_id: null,
        doctor_id: 2,
        name: 'Comprehensive Metabolic Panel',
        status: 'passed',
        sample: 'blood',
        duration: 1800,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 12000),
        end_time: new Date(now - 10200),
        created_at: now,
        updated_at: now
      },
      {
        individual_id: 2,
        corporate_id: null,
        doctor_id: 2,
        name: 'Vitamin D Level Check',
        status: 'passed',
        sample: 'blood',
        duration: 300,
        error_message: null,
        error_type: null,
        start_time: new Date(now - 6000),
        end_time: new Date(now - 5700),
        created_at: now,
        updated_at: now
      }
    ];

    const allTestResults = [
      ...testResultsIndividual1,
      ...testResultsIndividual2,
      ...testResultsCorporate1,
      ...testResultsCorporate2,
      ...testResultsDoctor1,
      ...testResultsDoctor2
    ];

    await queryInterface.bulkInsert('test_results', allTestResults, {});

    await transaction.commit()
  } catch (error) {
    logger.error('seed faild', { messaeg: `catch error message: ${JSON.stringify(error.messaeg)}`, exception: error })

    await transaction.rollback()
  }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('test_results', null, {});
  }
};
