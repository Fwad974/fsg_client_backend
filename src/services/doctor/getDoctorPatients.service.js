import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { ACCOUNT_TYPE } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    limit:          { type: 'number', minimum: 1, maximum: 100 },
    offset:         { type: 'number', minimum: 0 },
    search:         { type: 'string' },
    orderBy:        { type: 'string' },
    orderDirection: { type: 'string', enum: ['ASC', 'DESC'] }
  }
}

const constraints = ajv.compile(schema)

export default class GetDoctorPatientsService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId } } = this.context
    const { limit, offset, search, orderBy, orderDirection } = this.args

    logger.info('GetDoctorPatientsService: ', { message: 'Listing patients linked to caller doctor via patient_doctors', context: { userId: JSON.stringify(userId), args: JSON.stringify(this.args) } })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.DOCTOR, { attributes: ['doctorId'] })
    if (!owner?.doctorId) return this.addError('AccountNotLinkedErrorType')

    const { rows, count } = await PatientRepository.findAllByDoctorId(owner.doctorId, { limit, offset, search, orderBy, orderDirection })

    logger.info('GetDoctorPatientsService: ', { message: 'Doctor patient list returned', context: { count: JSON.stringify(count) } })

    return { message: 'OK', rows, count }
  }
}
