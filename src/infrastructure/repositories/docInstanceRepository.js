import IDocInstanceRepository from '../../domain/repositories/IDocInstanceRepository'
import models from '../../db/models'

export default class DocInstanceRepository extends IDocInstanceRepository {
  /**
   * Single-query authz lookup. Returns the doc instance only if:
   *   - uuid matches
   *   - status equals the passed-in status
   *   - the test_result the doc belongs to has the actor's owner column = ownerValue
   * Used by downloadReport. Defense-in-depth: filter at SQL source.
   */
  static async findByUuidScoped (uuid, ownerColumn, ownerValue, options = {}) {
    const { DocInstance: DocInstanceModel, TestResult: TestResultModel } = models
    const { status, attributes = ['id', 'uuid', 'status', 'pdfFilePath'] } = options

    return await DocInstanceModel.findOne({
      where: { uuid, status },
      attributes,
      include: [{
        model: TestResultModel,
        as: 'testResult',
        required: true,
        where: { [ownerColumn]: ownerValue },
        attributes: []
      }],
      raw: true,
      nest: true
    })
  }
}
