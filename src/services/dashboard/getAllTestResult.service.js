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

    const { count, rows } = await TestResultRepository.findAllByUserIdWithSearch(userId,
    {
      limit,
      offset,
      searchTerm,
      attributes: ['id', 'userId', 'name', 'status', 'duration', 'errorMessage', 'errorStack', 'errorType',  'startTime',
        'endTime', 'suiteName', 'filePath',  'fullName', 'tags', 'assertionResult', 'stdout', 'stderr', 'retryAttempts',
        'expectedValue', 'actualValue'
      ]
    })

    return  { count, rows }
  }
}
