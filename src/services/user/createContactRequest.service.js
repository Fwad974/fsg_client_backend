import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import ContactRequestRepository from '../../infrastructure/repositories/contactRequestRepository'
import _ from 'lodash'
import { CONTACT_REQUEST_STATUS } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    address: {
      type: 'string',
      maxLength: 500
    },
    contactNumber: {
      type: 'string',
      pattern: '^\\+?[0-9\\s\\-\\(\\)]{7,20}$',
      maxLength: 20
    },
    organization: {
      type: 'string',
      maxLength: 100
    },
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 1000
    }
  },
  required: ['name', 'email', 'message']
}

const constraints = ajv.compile(schema)

/**
 * Provides service to contact request
 * @export
 * @class SignupService
 * @extends {ServiceBase}
 */
export default class createContactRequestService extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const {
      sequelizeTransaction,
      auth: { id: userId },
      logger
    } = this.context

    logger.info('createContactRequestService: ', { message: 'this is the this.args', context: { args: JSON.stringify(this.args) } })

    const contactRequestObject = {
      name: this.args.name,
      email: this.args.email,
      address: this.args.address,
      contactNumber: this.args.contactNumber,
      organization: this.args.organization,
      message: this.args.message,
      status: CONTACT_REQUEST_STATUS.PENDING,
      userId
    }

    const filteredContactRequest = _.omitBy(contactRequestObject, _.isNil)

    const newContactRequest = await ContactRequestRepository.create(filteredContactRequest, sequelizeTransaction)

    return {
      message: 'Thank you for contacting us. Your request has been submitted successfully.',
      requestId: newContactRequest.requestId
    }
  }
}
