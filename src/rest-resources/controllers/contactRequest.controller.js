import CreateContactRequestService from '../../services/contactRequest/createContactRequest.service'
import { sendResponse } from '../../helpers/response.helpers'

export default class ContactRequestController {
  static async submit (req, res, next) {
    try {
      const { result, successful, errors } = await CreateContactRequestService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
