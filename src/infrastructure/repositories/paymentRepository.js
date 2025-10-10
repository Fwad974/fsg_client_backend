import models from '../../db/models'
import IPaymentRepository from '../../domain/repositories/IPaymentRepository'

export default class PaymentRepository extends IPaymentRepository {
  static async findById (id, options = {}) {
    const { Payment: PaymentModel } = models
    const { transaction } = options

    return await PaymentModel.findByPk(id, { transaction, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { Payment: PaymentModel } = models
    const { transaction } = options

    return await PaymentModel.findOne({
      where: { userId },
      transaction,
      raw: true
    })
  }

  static async create (payment, transaction) {
    const { Payment: PaymentModel } = models

    return await PaymentModel.create(payment, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { Payment: PaymentModel } = models

    return await PaymentModel.update(updateObject, {
      where: { id },
      transaction
    })
  }
}
