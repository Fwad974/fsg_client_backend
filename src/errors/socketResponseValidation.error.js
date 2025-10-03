import { SocketResponseValidationErrorType } from '../libs/errorTypes'
import BaseError from './base.error'

export default class SocketResponseValidationError extends BaseError {
  constructor (fields = {}) {
    super(SocketResponseValidationErrorType)
    this.fields = fields
  }
}
