import ajv from '../libs/ajv'

const patient = {
  $id: '/patient.json',
  type: 'object',
  properties: {
    id:           { type: 'number' },
    uuid:         { type: 'string' },
    firstName:    { type: ['string', 'null'] },
    lastName:     { type: ['string', 'null'] },
    dateOfBirth:  { type: ['string', 'null'], format: 'date' },
    email:        { type: ['string', 'null'] },
    phone:        { type: ['string', 'null'] },
    createdAt:    { type: 'string', format: 'date-time' },
    updatedAt:    { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(patient)

export default patient
