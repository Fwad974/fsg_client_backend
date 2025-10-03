import { RequestInputValidationErrorType } from '../libs/errorTypes'
import BaseError from './base.error'

export default class RequestInputValidationError extends BaseError {
  constructor (fields = {}) {
    super(RequestInputValidationErrorType)
    this.fields = fields
  }
}
