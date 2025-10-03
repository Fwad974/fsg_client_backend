import { socketSchemaBuilder } from '../../helpers/ajv.helpers'
import { SOCKET_LISTENERS, SOCKET_NAMESPACES, SOCKET_ROOMS } from '../../libs/constants'
import DemoHandler from '../handlers/demo.handler'
import contextSocketMiddleware from '../middlewares/contextSocket.middleware'
import requestValidationSocketMiddleware from '../middlewares/requestValidationSocket.middleware'

const socketSchemas = {
  [SOCKET_LISTENERS.DEMO_HELLO_WORLD]: {
    request: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    },
    response: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

/**
 *
 *
 * @export
 * @param {import('socket.io').Server} io
 */
export default function (io) {
  const namespace = io.of(SOCKET_NAMESPACES.DEMO)

  const compiledSchemas = socketSchemaBuilder(socketSchemas)

  namespace.on('connection', (socket) => {
    socket.use(contextSocketMiddleware(socket, compiledSchemas || {}))
    socket.use(requestValidationSocketMiddleware)

    socket.on(SOCKET_LISTENERS.DEMO_HELLO_WORLD, DemoHandler.helloWorld)
    socket.join(SOCKET_ROOMS.DEMO_USER)
  })
}
