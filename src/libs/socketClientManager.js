import { Manager } from 'socket.io-client'
import { SOCKET_NAMESPACES } from '../libs/constants'
import config from '../configs/app.config'

const socketClientManager = () => {
  const gameEngineClient = new Manager(config.get('game_engine_url')).socket(SOCKET_NAMESPACES.DEMO)
  return gameEngineClient
}

export default socketClientManager
