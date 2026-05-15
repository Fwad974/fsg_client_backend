// Request Type maps HTTP method to permission action
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
  CORPORATE: 'CORPORATE',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  ACCOUNTANT: 'ACCOUNTANT',
  REPORTS: 'REPORTS',
  TEST_CATALOG: 'TEST_CATALOG',

  aliases: {
    // hospital-account routes (URL prefix /corporate/* — public-facing vocab)
    'corporate/patients': 'CORPORATE',
    'corporate/patients-report': 'CORPORATE',

    // doctor routes
    'doctor/patients': 'DOCTOR',
    'doctor/patients-report': 'DOCTOR',

    // patient routes
    'patient/report-status': 'PATIENT',

    // shared report download (any role with REPORTS:R)
    'reports/download': 'REPORTS',

    // orderable catalog — corporate + doctor only
    'tests/catalogs': 'TEST_CATALOG',

    // corporate dashboard (CORPORATE-only)
    'dashboard/doc-status-overview': 'CORPORATE',
    'dashboard/kpi-overview': 'CORPORATE',
    'dashboard/test-category-distribution': 'CORPORATE',
    'dashboard/pending-actions': 'CORPORATE',
    'dashboard/pending-actions/acknowledge': 'CORPORATE',
    'dashboard/pending-actions/acknowledge-download': 'CORPORATE'
  }
}

export const PERMISSIONS = {
  CORPORATE: ['R', 'U'],
  DOCTOR: ['R'],
  PATIENT: ['R'],
  ACCOUNTANT: ['R'],
  REPORTS: ['R'],
  TEST_CATALOG: ['R']
}
