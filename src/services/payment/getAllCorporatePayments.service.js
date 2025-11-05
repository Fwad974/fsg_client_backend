import ServiceBase from '../../libs/serviceBase'
import PaymentTransactionRepository from '../../infrastructure/repositories/paymentTransactionRepository'
import Logger from '../../libs/logger'

/**
 * Service to get all corporate payment transactions
 * @export
 * @class GetAllCorporatePaymentsService
 * @extends {ServiceBase}
 */
export default class GetAllCorporatePaymentsService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId }
    } = this.context

    Logger.info('GetAllCorporatePaymentsService: ', { message: 'Getting payment transactions for corporate', context: { args: JSON.stringify(this.args) } })

    const {
      limit = 10,
      offset = 0,
      searchTerm = null
    } = this.args

    // First, find the payment record for the authenticated user which includes corporate info
    // const payment = await PaymentRepository.findByUserId(userId)

    Logger.info('GetAllCorporatePaymentsService: ', { message: 'Payment found', context: { payment: JSON.stringify(payment) } })

    if (!payment || !payment.corporate) {
      return { count: 0, rows: [] }
    }

    // Get all payment transactions for this corporate
    const { count, rows } = await PaymentTransactionRepository.findAllByCorporateIdWithSearch(payment.corporate.id, {
      limit,
      offset,
      searchTerm
    })

    return { count, rows }
  }
}
