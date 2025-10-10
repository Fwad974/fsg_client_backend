import ServiceBase from '../../libs/serviceBase'
import CorporateRepository from '../../infrastructure/repositories/corporateRepository'
import Logger from '../../libs/logger'

export default class GetCorporateDoctorsService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId }
    } = this.context

    Logger.info('GetCorporateDoctorsService: ', { message: 'Getting doctors for corporate', context: { args: JSON.stringify(this.args) } })

    const {
      limit = 10,
      offset = 1,
      searchTerm = null
    } = this.args

    const corporate = await CorporateRepository.findByUserId(userId)

    Logger.info('GetCorporateDoctorsService: ', { message: 'Corporate found', context: { corporate: JSON.stringify(corporate) } })

    if (!corporate) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await CorporateRepository.findDoctorsByCorporateId(corporate.id, {
      limit,
      offset,
      searchTerm
    })

    return { count, rows }
  }
}
