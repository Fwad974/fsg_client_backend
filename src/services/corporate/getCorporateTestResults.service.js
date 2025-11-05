import ServiceBase from '../../libs/serviceBase'
import CorporateRepository from '../../infrastructure/repositories/corporateRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'

/**
 * Service to get all test results for a corporate with patient information
 * @export
 * @class GetCorporateTestResultsService
 * @extends {ServiceBase}
 */
export default class GetCorporateTestResultsService extends ServiceBase {
  async run () {
    const { auth: { id: userId }, logger } = this.context

    logger.info('GetCorporateTestResultsService', { message: 'Getting test results for corporate', context: { args: JSON.stringify(this.args) } })

    const { limit, offset, searchTerm } = this.args

    const user = await UserRepository.findById(userId)

    logger.info('GetCorporateTestResultsService', { message: 'User found', context: { userId: JSON.stringify(user?.id), corporateId: JSON.stringify(user?.corporateId) } })

    if (!user || !user.corporateId) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await CorporateRepository.getCorporateTestResults(user.corporateId, { limit, offset, searchTerm })

    logger.info('GetCorporateTestResultsService', { message: 'Test results retrieved successfully', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })

    return { count, rows }
  }
}
