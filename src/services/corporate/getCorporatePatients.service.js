import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'

const schema = {
  type: 'object',
  properties: {
    limit: { type: 'number', minimum: 1, maximum: 100 },
    offset: { type: 'number', minimum: 0 },
    search: { type: 'string' },
    orderBy: { type: 'string' },
    orderDirection: { type: 'string', enum: ['ASC', 'DESC'] }
  }
}

const constraints = ajv.compile(schema)

export default class GetCorporatePatientsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { limit, offset, search, orderBy, orderDirection } = this.args
    logger.info('GetCorporatePatientsService: ', { message: 'Listing patients linked to caller hospital via patient_hospitals', context: { args: JSON.stringify(this.args) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetCorporatePatientsService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const patients = await PatientRepository.findAllByHospitalId(user.hospitalId, { limit, offset, search, orderBy, orderDirection })
    logger.info('GetCorporatePatientsService: ', { message: 'Hospital patient list fetched', context: { patients: JSON.stringify(patients) } })

    const { rows, count } = patients
    return { message: 'OK', rows, count }
  }
}
