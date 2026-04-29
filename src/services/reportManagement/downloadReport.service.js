import path from 'path'
import fs from 'fs/promises'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import DocInstanceRepository from '../../infrastructure/repositories/docInstanceRepository'
import UserRepository from '../../infrastructure/repositories/userRepository'
import { resolveOwnerScope } from '../../utils/resolveOwnerScope.utils'
import { DOC_INSTANCE_STATUS } from '../../libs/constants'

const schema = {
  type: 'object',
  properties: {
    docInstanceUuid: { type: 'string' }
  },
  required: ['docInstanceUuid']
}

const constraints = ajv.compile(schema)

export default class DownloadReportService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger, auth: { id: userId }, role: { accountType } } = this.context
    const { docInstanceUuid } = this.args

    logger.info('DownloadReportService: ', { message: 'Auth-scoped PDF download requested', context: { userId: JSON.stringify(userId), accountType: JSON.stringify(accountType), docInstanceUuid: JSON.stringify(docInstanceUuid) } })

    const owner = await UserRepository.findByIdAndType(userId, accountType, { attributes: ['hospitalId', 'doctorId', 'patientId'] })
    logger.info('DownloadReportService: ', { message: 'this is the owner:', context: { owner: JSON.stringify(owner) } })

    const scope = resolveOwnerScope({ accountType, ...owner })
    logger.info('DownloadReportService: ', { message: 'this is the scope:', context: { scope: JSON.stringify(scope) } })

    if (!scope || scope.value == null) return this.addError('AccountNotLinkedErrorType')

    const docInstance = await DocInstanceRepository.findByUuidScoped(docInstanceUuid, scope.column, scope.value, { status: DOC_INSTANCE_STATUS.RELEASED })
    logger.info('DownloadReportService: ', { message: 'this is the docInstance:', context: { docInstance: JSON.stringify(docInstance) } })

    if (!docInstance) return this.addError('DocInstanceNotFoundErrorType')
    if (!docInstance.pdfFilePath) return this.addError('PdfNotGeneratedErrorType')

    const filePath = path.join(process.cwd(), docInstance.pdfFilePath)

    try {
      await fs.access(filePath)
    } catch (error) {
      logger.error('DownloadReportService: ', { message: `PDF file missing on disk: ${error.message}`, exception: error })
      return this.addError('DocInstanceNotFoundErrorType')
    }

    const realPath = await fs.realpath(filePath)
    const allowedDir = await fs.realpath(path.join(process.cwd(), 'downloads'))

    if (!realPath.startsWith(allowedDir)) {
      logger.error('DownloadReportService: ', { message: 'Path traversal blocked outside downloads/', context: { realPath: JSON.stringify(realPath) } })
      return this.addError('DocInstanceNotFoundErrorType')
    }

    logger.info('DownloadReportService: ', { message: 'PDF resolved and authorized for stream', context: { docInstanceUuid: JSON.stringify(docInstanceUuid), fileName: JSON.stringify(path.basename(realPath)) } })

    return { filePath: realPath, fileName: path.basename(realPath) }
  }
}
