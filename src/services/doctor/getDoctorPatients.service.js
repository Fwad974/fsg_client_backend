import ServiceBase from '../../libs/serviceBase'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'

/**
 * Service to get all patients for a doctor
 * @export
 * @class GetDoctorPatientsService
 * @extends {ServiceBase}
 */
export default class GetDoctorPatientsService extends ServiceBase {
  async run () {
    const { auth: { id: userId }, logger } = this.context

    logger.info('GetDoctorPatientsService', { message: 'Getting patients for doctor', context: { args: JSON.stringify(this.args) } })

    const { limit, offset, searchTerm } = this.args

    const user = await UserRepository.findById(userId)

    logger.info('GetDoctorPatientsService', { message: 'User found', context: { userId: JSON.stringify(user?.id), doctorId: JSON.stringify(user?.doctorId) } })

    if (!user || !user.doctorId) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await DoctorRepository.getDoctorPatients(user.doctorId, { limit, offset, searchTerm })

    logger.info('GetDoctorPatientsService', { message: 'Patients retrieved successfully', context: { count: JSON.stringify(count), rowsLength: JSON.stringify(rows.length) } })

    return { count, rows }
  }
}
