import ajv from '../libs/ajv'

const testCategory = {
  $id: '/testCategory.json',
  type: 'object',
  properties: {
    id:                          { type: 'number' },
    testCode:                    { type: 'string' },
    testName:                    { type: 'string' },
    tat:                         { type: ['string', 'null'] },
    description:                 { type: ['string', 'null'] },
    testCategory:                { type: ['string', 'null'] },
    testSubCategory:             { type: ['string', 'null'] },
    financeDepartment:           { type: ['string', 'null'] },
    methodology:                 { type: ['string', 'null'] },
    specimenType:                { type: ['string', 'null'] },
    storageStability:            { type: ['string', 'null'] },
    transportationTemperature:   { type: ['string', 'null'] },
    isReferral:                  { type: 'boolean' },
    referralLab:                 { type: ['string', 'null'] },
    outsourceLabTestCode:        { type: ['string', 'null'] },
    clientTat:                   { type: ['string', 'null'] },
    createdAt:                   { type: 'string', format: 'date-time' },
    updatedAt:                   { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(testCategory)

export default testCategory
