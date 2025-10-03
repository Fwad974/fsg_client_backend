import { ResponseValidationErrorType } from '../libs/errorTypes'
import BaseError from './base.error'

export default class ResponseValidationError extends BaseError {
  constructor (fields = {}) {
    super(ResponseValidationErrorType)
    this.fields = fields
  }
}
