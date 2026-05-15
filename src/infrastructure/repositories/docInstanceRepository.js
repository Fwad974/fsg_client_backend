import IDocInstanceRepository from '../../domain/repositories/IDocInstanceRepository'
import models, { sequelize } from '../../db/models'
import { QueryTypes } from 'sequelize'
import { DOC_TEMPLATE_TYPE } from '../../libs/constants'

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

  static async countByStatusForHospitalRecordMgmt (hospitalId, { from, to }) {
    const rows = await sequelize.query(
      `SELECT di.status, COUNT(*)::int AS count
         FROM doc_instances di
         JOIN test_results  tr ON di.test_result_id  = tr.id
         JOIN doc_templates dt ON di.doc_template_id = dt.id
        WHERE dt.type = :templateType
          AND tr.hospital_id = :hospitalId
          AND tr.created_at BETWEEN :from AND :to
        GROUP BY di.status`,
      {
        replacements: {
          templateType: DOC_TEMPLATE_TYPE.RECORD_MANAGEMENT,
          hospitalId, from, to
        },
        type: QueryTypes.SELECT
      }
    )
    return rows.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
  }
}
