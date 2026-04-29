import ajv from '../libs/ajv'

const doctor = {
  $id: '/doctor.json',
  type: 'object',
  properties: {
    id:                   { type: 'number' },
    uuid:                 { type: 'string' },
    licenseNumber:        { type: ['string', 'null'] },
    clinicianName:        { type: ['string', 'null'] },
    clinicianPhoneNumber: { type: ['string', 'null'] },
    email:                { type: ['string', 'null'] },
    specialty:            { type: ['string', 'null'] },
    createdAt:            { type: 'string', format: 'date-time' },
    updatedAt:            { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(doctor)

export default doctor
