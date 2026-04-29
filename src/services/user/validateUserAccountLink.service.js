import ServiceBase from '../../libs/serviceBase'
import HospitalRepository from '../../infrastructure/repositories/hospitalRepository'
import DoctorRepository from '../../infrastructure/repositories/doctorRepository'
import PatientRepository from '../../infrastructure/repositories/patientRepository'
import ajv from '../../libs/ajv'
import { resolveOwnerScope } from '../../utils/resolveOwnerScope.utils'

const schema = {
  type: 'object',
  properties: {
    accountType: { type: 'string', enum: ['corporate', 'patient', 'doctor'] },
    hospitalId:  { type: ['number', 'string', 'null'] },
    doctorId:    { type: ['number', 'string', 'null'] },
    patientId:   { type: ['number', 'string', 'null'] }
  },
  required: ['accountType']
}

const constraints = ajv.compile(schema)

const REPO_BY_TYPE = {
  corporate: HospitalRepository,
  doctor: DoctorRepository,
  patient: PatientRepository
}

export default class ValidateUserAccountLinkService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const { accountType, hospitalId, doctorId, patientId } = this.args

    logger.info('ValidateUserAccountLinkService: ', { message: 'Verifying account FK resolves to a real entity row at login', context: { accountType: JSON.stringify(accountType) } })

    const scope = resolveOwnerScope({ accountType, hospitalId, doctorId, patientId })
    if (!scope || scope.value == null) return this.addError('AccountNotLinkedErrorType')

    const repo = REPO_BY_TYPE[accountType]
    logger.info('ValidateUserAccountLinkService: ', { message: 'this is the repo:', context: { repo: JSON.stringify(repo) } })

    const entity = await repo.findById(scope.value, { attributes: ['id'] })
    logger.info('ValidateUserAccountLinkService: ', { message: 'this is the entity:', context: { entity: JSON.stringify(entity) } })

    if (!entity) return this.addError('AccountLinkBrokenErrorType')

    logger.info('ValidateUserAccountLinkService: ', { message: 'Account link validated', context: { column: scope.column, id: JSON.stringify(scope.value) } })

    return { column: scope.column, id: scope.value }
  }
}
