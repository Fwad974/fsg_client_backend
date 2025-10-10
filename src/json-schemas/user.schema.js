import ajv from '../libs/ajv'

const user = {
  $id: '/user.json',
  type: 'object',
  properties: {
    id: { type: 'string' },
    userRoleId: { type: 'number' },
    uuid: { type: 'string' },
    firstName: { type: ['string', 'null'] },
    lastName: { type: ['string', 'null'] },
    email: { type: ['string', 'null'] },
    emailVerified: { type: 'boolean' },
    verifiedAt: { type: ['string', 'null'], format: 'date-time' },
    encryptedPassword: { type: ['string', 'null'] },
    phone: { type: ['string', 'null'] },
    phoneCode: { type: ['string', 'null'] },
    phoneVerified: { type: 'boolean' },
    dateOfBirth: { type: ['string', 'null'], format: 'date-time' },
    gender: { type: ['string', 'null'] },
    profileImageUrl: { type: ['string', 'null'] },
    signInCount: { type: 'number' },
    signInIp: { type: ['string', 'null'] },
    userName: { type: ['string', 'null'] },
    countryCode: { type: ['string', 'null'] },
    deletedAt: { type: ['string', 'null'], format: 'date-time' },
    lastLogin: { type: ['string', 'null'], format: 'date-time' },
    userType: { type: ['string', 'null'] },
    address1: { type: ['string', 'null'] },
    address2: { type: ['string', 'null'] },
    city: { type: ['string', 'null'] },
    state: { type: ['string', 'null'] },
    postalCode: { type: ['string', 'null'] },
    country: { type: ['string', 'null'] },
    bloodType: { type: ['string', 'null'] },
    allergies: { type: ['string', 'null'] },
    medicalConditions: { type: ['string', 'null'] },
    emergencyContactName: { type: ['string', 'null'] }, // Note: Model has BIGINT but likely should be STRING
    emergencyContactPhone: { type: ['string', 'null'] },
    emergencyContactRelationship: { type: ['string', 'null'] },
    insuranceProvider: { type: ['string', 'null'] },
    insurancePolicyNumber: { type: ['string', 'null'] },
    insuranceGroupNumber: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    role: { $ref: '/userRole.json' }
  }
}

ajv.addSchema(user)
