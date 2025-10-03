import { createServer } from 'http'
import config from './src/configs/app.config'
import './src/json-schemas'
import gracefulShutDown from './src/libs/gracefulShutDown'
import Logger from './src/libs/logger'
import app from './src/rest-resources'
import socketServer from './src/socket-resources'

const httpServer = createServer(app)

httpServer.keepAliveTimeout = 65000
httpServer.headersTimeout = 66000
Logger.info('server keep alive timeout: ', { message: httpServer.keepAliveTimeout })
Logger.info('server header timeout: ', { message: httpServer.headersTimeout })

socketServer.attach(httpServer)

httpServer.listen({ port: config.get('port') }, () => {
  Logger.info('Server Started', { message: `Listening On ${config.get('port')}` })
})

process.on('SIGTERM', gracefulShutDown)
process.on('SIGINT', gracefulShutDown)
process.on('SIGUSR2', gracefulShutDown)
