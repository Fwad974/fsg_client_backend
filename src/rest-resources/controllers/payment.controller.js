import { sendResponse } from '../../helpers/response.helpers'
import GetAllCorporatePaymentsService from '../../services/payment/getAllCorporatePayments.service'

export default class PaymentController {
  static async getAllCorporatePayments (req, res, next) {
    try {
      const { result, successful, errors } = await GetAllCorporatePaymentsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
