import ServiceBase from '../../libs/serviceBase'
import ajv from '../../libs/ajv'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  required: ['name']
}

const constraints = ajv.compile(schema)

export default class HelloWorldService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    return { message: 'Hello ' + this.args.name }
  }
}
