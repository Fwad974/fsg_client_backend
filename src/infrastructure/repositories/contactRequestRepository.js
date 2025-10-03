import IContactRequestRepository from '../../domain/repositories/IContactRequestRepository'
import models from '../../db/models'

export default class ContactRequestRepository extends IContactRequestRepository {
  findById (id, options = {}) {
    const { ContactRequest: ContactRequestModel } = models

    const {
      attributes = ['id']
    } = options

    return ContactRequestModel.findByPk(id, { attributes, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { ContactRequest: ContactRequestModel } = models

    const {
      attributes = ['id']
    } = options

    return await ContactRequestModel.findOne({ where: { userId }, attributes, raw: true })
  }

  static async create (contactRequest, transaction) {
    const { ContactRequest: ContactRequestModel } = models

    return await ContactRequestModel.create(contactRequest, { transaction })
  }
}
