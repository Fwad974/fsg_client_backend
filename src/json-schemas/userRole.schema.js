import ajv from '../libs/ajv'

const userRole = {
  $id: '/userRole.json',
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: ['string', 'null'] },
    roleType: { type: ['string', 'null'] },
    permission: {
      type: ['object', 'null'],
      additionalProperties: true
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

ajv.addSchema(userRole)

export default userRole