import models from '../../db/models'
import IIndividualRepository from '../../domain/repositories/IIndividualRepository'

export default class IndividualRepository extends IIndividualRepository {
  static async findById (id, options = {}) {
    const { Individual: IndividualModel } = models
    const { transaction } = options

    return await IndividualModel.findByPk(id, { transaction, raw: true })
  }

  static async findByUserId (userId, options = {}) {
    const { Individual: IndividualModel } = models
    const { transaction } = options

    return await IndividualModel.findOne({
      where: { userId },
      transaction,
      raw: true
    })
  }

  static async findByEmiratesId (emiratesId, options = {}) {
    const { Individual: IndividualModel } = models
    const {
       transaction,
       attributes = ['id', 'userId', 'emiratesId']
      } = options

    return await IndividualModel.findOne({
      where: { emiratesId },
      transaction,
      attributes
    })
  }

  static async create (individual, transaction) {
    const { Individual: IndividualModel } = models

    return await IndividualModel.create(individual, { transaction })
  }

  static async update (id, updateObject, transaction) {
    const { Individual: IndividualModel } = models

    return await IndividualModel.update(updateObject, {
      where: { id },
      transaction
    })
  }
}
