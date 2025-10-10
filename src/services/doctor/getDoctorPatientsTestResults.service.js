import ServiceBase from '../../libs/serviceBase'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import Logger from '../../libs/logger'

/**
 * Service to get all test results for a doctor's patients
 * @export
 * @class GetDoctorPatientsTestResultsService
 * @extends {ServiceBase}
 */
export default class GetDoctorPatientsTestResultsService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId }
    } = this.context

    Logger.info('GetDoctorPatientsTestResultsService: ', { message: 'Getting test results for doctor patients', context: { args: JSON.stringify(this.args) } })

    const {
      limit = 10,
      offset = 1,
      searchTerm = null
    } = this.args

    const doctor = await DoctorRepository.findByUserId(userId)

    Logger.info('GetDoctorPatientsTestResultsService: ', { message: 'Doctor found', context: { doctor: JSON.stringify(doctor) } })

    if (!doctor) {
      return { count: 0, rows: [] }
    }

    const { count, rows } = await DoctorRepository.findPatientsTestResultsByDoctorId(doctor.id, {
      limit,
      offset,
      searchTerm
    })

    return { count, rows }
  }
}
