import ajv from '../libs/ajv'
import localize from 'ajv-i18n'

/**
 *
 *
 * @param {string} schemaKey
 * @param {*} data
 * @returns [boolean, *]
 */
export const validateData = (schemaKey, data, locale = 'en-US') => {
  const schema = ajv.getSchema(schemaKey)

  locale = locale.split('-')[0]

  if (schema && !schema(data)) {
    localize[locale](schema.errors)
    const errors = ajv.errorsText(schema.errors, { separator: ' ||||| ' }).split(' ||||| ')
    return [false, errors]
  }

  return [true, null]
}

export const socketSchemaBuilder = (schemas = {}) => {
  const compiledNamespaceSchemas = {}

  Object.keys(schemas).forEach(eventSchemas => {
    compiledNamespaceSchemas[eventSchemas] = {}
    compiledNamespaceSchemas[eventSchemas].request = ajv.compile(schemas[eventSchemas].request)
    compiledNamespaceSchemas[eventSchemas].response = ajv.compile(schemas[eventSchemas].response)
  })

  return compiledNamespaceSchemas
}
