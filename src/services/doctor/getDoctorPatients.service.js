import ServiceBase from '../../libs/serviceBase'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import Logger from '../../libs/logger'

/**
 * Service to get all patients for a doctor
 * @export
 * @class GetDoctorPatientsService
 * @extends {ServiceBase}
 */
export default class GetDoctorPatientsService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId }
    } = this.context

    Logger.info('GetDoctorPatientsService: ', { message: 'Getting patients for user', context: { args: JSON.stringify(this.args) } })

    const {
      limit = 10,
      offset = 1,
      searchTerm = null
    } = this.args

    const doctor = await DoctorRepository.findByUserId(userId)

    Logger.info('GetDoctorPatientsService: ', { message: 'Doctor found', context: { doctor: JSON.stringify(doctor) } })

    if (!doctor) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await DoctorRepository.findPatientsByDoctorId(doctor.id, {
      limit,
      offset,
      searchTerm
    })

    return { count, rows }
  }
}
