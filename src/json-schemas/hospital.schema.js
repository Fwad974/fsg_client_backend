import ajv from '../libs/ajv'

const hospital = {
  $id: '/hospital.json',
  type: 'object',
  properties: {
    id:           { type: 'number' },
    uuid:         { type: 'string' },
    hospitalName: { type: ['string', 'null'] },
    email:        { type: ['string', 'null'] },
    phone:        { type: ['string', 'null'] },
    address:      { type: ['string', 'null'] },
    createdAt:    { type: 'string', format: 'date-time' },
    updatedAt:    { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(hospital)

export default hospital
