import models from '../../db/models'
import IPaymentTransactionRepository from '../../domain/repositories/IPaymentTransactionRepository'
import { Op } from 'sequelize'

export default class PaymentTransactionRepository extends IPaymentTransactionRepository {
  static async findById (id, options = {}) {
    const { PaymentTransaction: PaymentTransactionModel } = models
    const { transaction } = options

    return await PaymentTransactionModel.findByPk(id, { transaction, raw: true })
  }

  static async findAllByCorporateIdWithSearch (corporateId, options = {}) {
    const { PaymentTransaction: PaymentTransactionModel, User: UserModel, Individual: IndividualModel } = models

    const whereClause = { corporateId }

    const {
      attributes = ['id', 'actioneeType', 'userId', 'corporateId', 'amount', 'status', 'comments', 'transactionType', 'paymentMethod', 'transactionId', 'moreDetails', 'paymentMethodId', 'createdAt', 'updatedAt'],
      offset = 0,
      limit = 10,
      orderBy = [['createdAt', 'DESC']],
      searchTerm = null
    } = options

    if (searchTerm) {
      whereClause[Op.or] = [
        { transactionId: { [Op.iLike]: `%${searchTerm}%` } },
        { comments: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    }

    const { count, rows } = await PaymentTransactionModel.findAndCountAll({
      where: whereClause,
      attributes,
      limit,
      offset,
      order: orderBy,
      include: [
        {
          model: IndividualModel,
          as: 'individual',
          include: [
            {
              model: UserModel,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            }
          ]
        }
      ]
    })

    return { count, rows }
  }

  static async create (paymentTransaction, transaction) {
    const { PaymentTransaction: PaymentTransactionModel } = models

    return await PaymentTransactionModel.create(paymentTransaction, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { PaymentTransaction: PaymentTransactionModel } = models

    return await PaymentTransactionModel.update(updateObject, {
      where: { id },
      transaction
    })
  }
}
