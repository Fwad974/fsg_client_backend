import { InvalidSocketArgumentErrorType } from '../libs/errorTypes'
import BaseError from './base.error'

export default class InvalidSocketArgumentError extends BaseError {
  constructor (fields = {}) {
    super(InvalidSocketArgumentErrorType)
    this.fields = fields
  }
}
