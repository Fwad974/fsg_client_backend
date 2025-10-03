import Flatted from 'flatted'
import { validateData } from '../../helpers/ajv.helpers'
import ajv from '../../libs/ajv'
import Logger from '../../libs/logger'
import socketEmitter from '../../libs/socketEmitter'
import { SOCKET_EMITTERS, SOCKET_NAMESPACES, SOCKET_ROOMS } from '../../libs/constants'
import { SocketResponseValidationErrorType } from '../../libs/errorTypes'

const helloWorldSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' }
  },
  required: ['message']
}

ajv.addSchema(helloWorldSchema, 'emitHelloWorld')
ajv.addSchema(helloWorldSchema, 'emitHelloWorldToRoom')

/**
 * Demo Emitter for Emitting things related to the /demo namespace
 *
 * @export
 * @class DemoEmitter
 */
export default class DemoEmitter {
  static async emitHelloWorld (payload) {
    try {
      payload = Flatted.parse(Flatted.stringify(payload))
      const [isValid, errors] = validateData('emitHelloWorld', payload)
      if (isValid) {
        socketEmitter.of(SOCKET_NAMESPACES.DEMO).emit(SOCKET_EMITTERS.DEMO_HELLO_WORLD, { data: payload })
      } else {
        Logger.info(SocketResponseValidationErrorType.name, { message: SocketResponseValidationErrorType.description, fault: errors })
      }
    } catch (error) {
      Logger.info('Error In Emitter', { message: 'Error in Emitter while emitting on hello world' })
      Logger.info('Actual Error', { exception: error })
    }
  }

  static async emitHelloWorldToRoom (payload) {
    try {
      payload = Flatted.parse(Flatted.stringify(payload))
      const [isValid, errors] = validateData('emitHelloWorldToRoom', payload)
      if (isValid) {
        socketEmitter.of(SOCKET_NAMESPACES.DEMO).to(SOCKET_ROOMS.DEMO_USER).emit(SOCKET_EMITTERS.DEMO_HELLO_WORLD, { data: payload })
      } else {
        Logger.info(SocketResponseValidationErrorType.name, { message: SocketResponseValidationErrorType.description, fault: errors })
      }
    } catch (error) {
      Logger.info('Error In Emitter', { message: 'Error in Emitter while emitting on hello world' })
      Logger.info('Actual Error', { exception: error })
    }
  }
}
