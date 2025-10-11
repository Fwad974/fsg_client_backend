// Request Type maps admin's action to permission
export const REQUEST_TYPE = {
  GET: 'R',
  POST: 'C',
  PUT: 'U',
  PATCH: 'U',
  DELETE: 'D',
  TOGGLE: 'T'
}

// Endpoint to Module mapper
export const PERMISSION_TYPE = {
  COPORATE: 'COPORATE',
  USER: 'USER',
  PAYMENT: 'PAYMENT',
  DOCTOR: 'DOCTOR',
  TRANSACTION: 'TRANSACTION',
  REPORTS: 'REPORTS',
  INDIVIDUAL: 'individual',

  aliases: {
    // Dashboard
    'dashboard/get-all-test-results': 'INDIVIDUAL',
    'dashboard/get-patient-test-results': 'REPORTS',
    'dashboard/get-patient-reports': 'REPORTS',

    // transaction
    'transaction/user-transactions': 'INDIVIDUAL',
    'transaction/coprate-transactions': 'TRANSACTION',

    // doctor
    'doctor/get-patients': 'DOCTOR',
    'doctor/get-patients-test-results': 'DOCTOR',

    // corporate
    'corporate/get-patients': 'COPORATE',
    'corporate/get-doctors': 'COPORATE',
    'corporate/get-patients-test-results': 'COPORATE',

  }
}

// Permission Object
export const PERMISSIONS = {
  Dashboard: ['R'],
  TRANSACTION: ['R'],
  REPORTS: ['R'],
  DOCTOR: ['R'],
  COPORATE: ['R'],
  INDIVIDUAL: ['R']
}
