import { SocketRequestInputValidationErrorType } from '../libs/errorTypes'
import BaseError from './base.error'

export default class SocketRequestInputValidationError extends BaseError {
  constructor (fields = {}) {
    super(SocketRequestInputValidationErrorType)
    this.fields = fields
  }
}
