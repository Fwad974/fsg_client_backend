import ServiceBase from '../../libs/serviceBase'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'

/**
 * Service to get all test results for a doctor with patient information
 * @export
 * @class GetDoctorTestResultsService
 * @extends {ServiceBase}
 */
export default class GetDoctorTestResultsService extends ServiceBase {
  async run () {
    const { auth: { id: userId }, logger } = this.context

    logger.info('GetDoctorTestResultsService', { message: 'Getting test results for doctor', context: { args: JSON.stringify(this.args) } })

    const { limit, offset, searchTerm } = this.args

    const user = await UserRepository.findById(userId)

    logger.info('GetDoctorTestResultsService', { message: 'User found', context: { userId: JSON.stringify(user?.id), doctorId: JSON.stringify(user?.doctorId) } })

    if (!user || !user.doctorId) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await DoctorRepository.getDoctorTestResults(user.doctorId, { limit, offset, searchTerm })
    console.log('this is the rows', JSON.stringify(rows))

    logger.info('GetDoctorTestResultsService', { message: 'Test results retrieved successfully', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })

    return { count, rows }
  }
}
