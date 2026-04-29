import ajv from '../libs/ajv'

const testResult = {
  $id: '/testResult.json',
  type: 'object',
  properties: {
    id:             { type: 'number' },
    uuid:           { type: 'string' },
    patientId:      { type: 'number' },
    hospitalId:     { type: 'number' },
    doctorId:       { type: 'number' },
    formRequestId:  { type: 'number' },
    testCategoryId: { type: ['number', 'null'] },
    status:         { type: 'string' },
    labStatus:      { type: ['string', 'null'] },
    turnAroundTime: { type: ['string', 'null'] },
    createdAt:      { type: 'string', format: 'date-time' },
    updatedAt:      { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(testResult)

export default testResult
