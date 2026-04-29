import IHospitalRepository from '../../domain/repositories/IHospitalRepository'
import models from '../../db/models'

export default class HospitalRepository extends IHospitalRepository {
  static async findById (id, options = {}) {
    const { Hospital: HospitalModel } = models
    const { attributes = ['id', 'uuid', 'hospitalName'] } = options

    return await HospitalModel.findByPk(id, { attributes, raw: true })
  }
}
