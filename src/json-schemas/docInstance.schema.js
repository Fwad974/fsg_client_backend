import ajv from '../libs/ajv'

const docInstance = {
  $id: '/docInstance.json',
  type: 'object',
  properties: {
    id:           { type: 'number' },
    uuid:         { type: 'string' },
    testResultId: { type: 'number' },
    status:       { type: 'string' },
    pdfFilePath:  { type: ['string', 'null'] },
    releasedDate: { type: ['string', 'null'], format: 'date-time' },
    reportedDate: { type: ['string', 'null'], format: 'date-time' },
    createdAt:    { type: 'string', format: 'date-time' },
    updatedAt:    { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(docInstance)

export default docInstance
