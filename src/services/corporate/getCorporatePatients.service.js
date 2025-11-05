import ServiceBase from '../../libs/serviceBase'
import CorporateRepository from '../../infrastructure/repositories/corporateRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'

export default class GetCorporatePatientsService extends ServiceBase {
  async run () {
    const { auth: { id: userId }, logger } = this.context

    logger.info('GetCorporatePatientsService', { message: 'Getting patients for corporate', context: { args: JSON.stringify(this.args) } })

    const { limit, offset, searchTerm } = this.args

    const user = await UserRepository.findById(userId)

    logger.info('GetCorporatePatientsService', { message: 'User found', context: { userId: JSON.stringify(user?.id), corporateId: JSON.stringify(user?.corporateId) } })

    if (!user || !user.corporateId) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await CorporateRepository.getCorporatePatients(user.corporateId, { limit, offset, searchTerm })

    logger.info('GetCorporatePatientsService', { message: 'Patients retrieved successfully', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })

    return { count, rows }
  }
}
