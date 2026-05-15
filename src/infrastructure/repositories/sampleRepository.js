import models from '../../db/models'
import { Op } from 'sequelize'
import { SAMPLE_STATUS } from '../../libs/constants'

class SampleRepository {
  static async countByHospital (hospitalId, { from, to }) {
    const { Sample: SampleModel, SampleDelivery: SampleDeliveryModel } = models
    return SampleModel.count({
      where: { createdAt: { [Op.between]: [from, to] } },
      include: [{
        model: SampleDeliveryModel,
        as: 'sampleDelivery',
        where: { hospitalId },
        required: true,
        attributes: []
      }]
    })
  }

  static async countRejectedByHospital (hospitalId, { from, to }) {
    const { Sample: SampleModel, SampleDelivery: SampleDeliveryModel } = models
    return SampleModel.count({
      where: {
        status: SAMPLE_STATUS.REJECTED,
        createdAt: { [Op.between]: [from, to] }
      },
      include: [{
        model: SampleDeliveryModel,
        as: 'sampleDelivery',
        where: { hospitalId },
        required: true,
        attributes: []
      }]
    })
  }
}

export default SampleRepository
