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

    // Sample test results for user 1
    const testResultsUser1 = [
      {
        user_id: 1, // User ID 1
        name: 'User Login Authentication',
        status: 'passed',
        duration: 125, // Duration in milliseconds
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 10000), // 10 seconds ago
        end_time: new Date(now - 9875),   // Calculated end time
        suite_name: 'Authentication Suite',
        file_path: 'tests/auth/login.test.js',
        full_name: 'Authentication Suite User Login Authentication',
        tags: ['auth', 'integration', 'critical'],
        assertion_result: null, // Or JSON string if needed
        stdout: 'Login attempt successful.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: true,
        actual_value: true,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'User Profile Update Validation',
        status: 'failed',
        duration: 89,
        error_message: 'Validation error: Email format is invalid',
        error_stack: 'ValidationError: Email format is invalid\n    at ...',
        error_type: 'ValidationError',
        start_time: new Date(now - 5000), // 5 seconds ago
        end_time: new Date(now - 4911),   // Calculated end time
        suite_name: 'User Management Suite',
        file_path: 'tests/user/profile.test.js',
        full_name: 'User Management Suite User Profile Update Validation',
        tags: ['user', 'validation', 'bug'],
        assertion_result: null,
        stdout: 'Starting profile update...\n',
        stderr: 'Error: Validation error: Email format is invalid\n',
        retry_attempts: 1,
        expected_value: 'valid email object',
        actual_value: 'invalid_email_string',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'API Endpoint Rate Limiting',
        status: 'passed',
        duration: 1500,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 25000), // 25 seconds ago
        end_time: new Date(now - 23500),
        suite_name: 'API Security Suite',
        file_path: 'tests/api/security/rate_limit.test.js',
        full_name: 'API Security Suite API Endpoint Rate Limiting',
        tags: ['api', 'security', 'rate_limit'],
        assertion_result: null,
        stdout: 'Testing rate limits...\nLimits enforced correctly.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: 429,
        actual_value: 429,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Data Export Format Verification',
        status: 'failed',
        duration: 3200,
        error_message: 'Exported file format does not match expected schema',
        error_stack: 'AssertionError: expected format to be CSV but got TSV\n    at ...',
        error_type: 'AssertionError',
        start_time: new Date(now - 22000), // 22 seconds ago
        end_time: new Date(now - 18800),
        suite_name: 'Data Processing Suite',
        file_path: 'tests/data/export.test.js',
        full_name: 'Data Processing Suite Data Export Format Verification',
        tags: ['data', 'export', 'format', 'bug'],
        assertion_result: null,
        stdout: 'Initiating data export...\nVerifying schema...\n',
        stderr: 'Error: AssertionError: expected format to be CSV but got TSV\n',
        retry_attempts: 0,
        expected_value: 'CSV format',
        actual_value: 'TSV format',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'User Preference Persistence',
        status: 'passed',
        duration: 500,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 20000), // 20 seconds ago
        end_time: new Date(now - 19500),
        suite_name: 'User Settings Suite',
        file_path: 'tests/user/preferences.test.js',
        full_name: 'User Settings Suite User Preference Persistence',
        tags: ['user', 'settings', 'persistence'],
        assertion_result: null,
        stdout: 'Setting preference...\nSaving...\nLoading...\nVerified.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: "{ theme: 'dark', notifications: true }",
        actual_value: "{ theme: 'dark', notifications: true }",
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Long Running Background Task',
        status: 'timedOut',
        duration: 30000, // Reached timeout
        error_message: 'Test execution exceeded timeout of 30s',
        error_stack: null, // Timeout might not have a stack trace
        error_type: 'TimeoutError',
        start_time: new Date(now - 40000), // 40 seconds ago
        end_time: new Date(now - 10000), // 10 seconds ago (when timeout occurred)
        suite_name: 'Performance Suite',
        file_path: 'tests/performance/background_task.test.js',
        full_name: 'Performance Suite Long Running Background Task',
        tags: ['performance', 'timeout', 'background'],
        assertion_result: null,
        stdout: 'Starting long task...\nStill processing...\n',
        stderr: 'TimeoutError: Test execution exceeded timeout of 30s\n',
        retry_attempts: 0,
        expected_value: 'task completed',
        actual_value: 'task still running',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Feature Toggle A/B Test Setup',
        status: 'passed',
        duration: 200,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 15000), // 15 seconds ago
        end_time: new Date(now - 14800),
        suite_name: 'Feature Management Suite',
        file_path: 'tests/feature/toggle.test.js',
        full_name: 'Feature Management Suite Feature Toggle A/B Test Setup',
        tags: ['feature', 'toggle', 'ab_test'],
        assertion_result: null,
        stdout: 'Enabling feature...\nAssigning user to group A...\nVerified.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: true,
        actual_value: true,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Concurrent User Session Handling',
        status: 'failed',
        duration: 1800,
        error_message: 'Concurrent session limit exceeded',
        error_stack: 'SessionError: Maximum concurrent sessions (2) reached\n    at ...',
        error_type: 'SessionError',
        start_time: new Date(now - 12000), // 12 seconds ago
        end_time: new Date(now - 10200),
        suite_name: 'Session Management Suite',
        file_path: 'tests/session/concurrent.test.js',
        full_name: 'Session Management Suite Concurrent User Session Handling',
        tags: ['session', 'concurrency', 'limit'],
        assertion_result: null,
        stdout: 'Opening session 1...\nOpening session 2...\nAttempting session 3...\n',
        stderr: 'Error: SessionError: Maximum concurrent sessions (2) reached\n',
        retry_attempts: 1,
        expected_value: 'session opened',
        actual_value: 'session limit error',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'File Upload Size Validation',
        status: 'passed',
        duration: 800,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 10000), // 10 seconds ago
        end_time: new Date(now - 9200),
        suite_name: 'File Handling Suite',
        file_path: 'tests/file/upload_validation.test.js',
        full_name: 'File Handling Suite File Upload Size Validation',
        tags: ['file', 'upload', 'validation'],
        assertion_result: null,
        stdout: 'Attempting upload of large file...\nValidation triggered...\nDenied.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: 413, // Payload Too Large
        actual_value: 413,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Email Notification Template Check',
        status: 'skipped',
        duration: 0,
        error_message: 'Email service mock not configured for this test environment',
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 8000), // 8 seconds ago
        end_time: new Date(now - 8000),
        suite_name: 'Notification Suite',
        file_path: 'tests/notification/email_template.test.js',
        full_name: 'Notification Suite Email Notification Template Check',
        tags: ['notification', 'email', 'template', 'env_specific'],
        assertion_result: null,
        stdout: 'Skipping email template test in non-staging environment.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: null,
        actual_value: null,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Database Connection Pool Health',
        status: 'passed',
        duration: 300,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 6000), // 6 seconds ago
        end_time: new Date(now - 5700),
        suite_name: 'Infrastructure Suite',
        file_path: 'tests/infra/db_pool.test.js',
        full_name: 'Infrastructure Suite Database Connection Pool Health',
        tags: ['infra', 'db', 'pool', 'health'],
        assertion_result: null,
        stdout: 'Checking pool status...\nAll connections healthy.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: 'healthy',
        actual_value: 'healthy',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // User ID 1
        name: 'Cache Invalidation Strategy',
        status: 'passed',
        duration: 1200,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 4000), // 4 seconds ago
        end_time: new Date(now - 2800),
        suite_name: 'Performance Suite',
        file_path: 'tests/performance/cache_invalidation.test.js',
        full_name: 'Performance Suite Cache Invalidation Strategy',
        tags: ['performance', 'cache', 'invalidation'],
        assertion_result: null,
        stdout: 'Storing data in cache...\nInvalidating...\nFetching new data...\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: 'fresh data',
        actual_value: 'fresh data',
        created_at: now,
        updated_at: now
      }
    ];

    // Sample test results for user 2
    const testResultsUser2 = [
      {
        user_id: 2, // User ID 2
        name: 'Payment Processing Success',
        status: 'passed',
        duration: 2105,
        error_message: null,
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 15000), // 15 seconds ago
        end_time: new Date(now - 12895),   // Calculated end time
        suite_name: 'Payment Suite',
        file_path: 'tests/payment/process.test.js',
        full_name: 'Payment Suite Payment Processing Success',
        tags: ['payment', 'integration', 'critical'],
        assertion_result: null,
        stdout: 'Payment gateway initialized.\nTransaction processed successfully.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: 'payment success response',
        actual_value: 'payment success response',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 2, // User ID 2
        name: 'Feature Flag Check',
        status: 'skipped',
        duration: 0, // Skipped tests often have 0 duration
        error_message: 'Feature not yet implemented',
        error_stack: null,
        error_type: null,
        start_time: new Date(now - 8000), // 8 seconds ago
        end_time: new Date(now - 8000),   // Start and end time often same for skipped
        suite_name: 'Feature Flag Suite',
        file_path: 'tests/feature/flag.test.js',
        full_name: 'Feature Flag Suite Feature Flag Check',
        tags: ['feature', 'wip'],
        assertion_result: null,
        stdout: 'Skipping test as feature is disabled.\n',
        stderr: null,
        retry_attempts: 0,
        expected_value: null,
        actual_value: null,
        created_at: now,
        updated_at: now
      }
    ]

    // Combine results for both users
    const allTestResults = [...testResultsUser1, ...testResultsUser2];

    await queryInterface.bulkInsert('test_results', allTestResults, {});

    await transaction.commit()
  } catch (error) {
    logger.error('seed faild', { messaeg: `catch error message: ${JSON.stringify(error.messaeg)}`, exception: error })

    await transaction.rollback()
  }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('test_results', {
      user_id: [1, 2]
    }, {});
  }
};
