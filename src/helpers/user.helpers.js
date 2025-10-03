import { v4 as uuidv4 } from 'uuid'

export const generateNonce = () => {
  return `${uuidv4()}#${new Date().getTime()}`
}
