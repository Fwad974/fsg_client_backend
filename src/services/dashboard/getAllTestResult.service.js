import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'

/**
 * Universal email service for sending template-based emails
 * Supports configurable URLs and dynamic data
 * @export
 * @class SendTemplateEmailService
 * @extends {ServiceBase}
 */
export default class GetAllTestResultService extends ServiceBase {
  async run () {
    const {
      auth: { id: userId },
      logger
    } = this.context

    logger.info('GetAllTestResultService: ', { message: `this is the this.args line 39: ${JSON.stringify(this.args)}` })

    const {
      limit = 10,
      offset = 1,
      searchTerm = null
    } = this.args

    const { count, rows } = await TestResultRepository.findAllByIndividualIdWithSearch(userId,
    {
      limit,
      offset,
      searchTerm,
      attributes: ['id', 'individualId', 'corporateId', 'doctorId', 'name', 'status', 'sample', 'duration', 'errorMessage', 'errorType', 'startTime',
        'endTime', 'description', 'code', 'turnAroundTime', 'fileUuid', 'fileName'
      ]
    })

    return  { count, rows }
  }
}
