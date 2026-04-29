import IPatientRepository from '../../domain/repositories/IPatientRepository'
import models from '../../db/models'
import { Op } from 'sequelize'

export default class PatientRepository extends IPatientRepository {
  static async findById (id, options = {}) {
    const { Patient: PatientModel } = models
    const { attributes = ['id', 'uuid', 'firstName', 'lastName'] } = options

    return await PatientModel.findByPk(id, { attributes, raw: true })
  }

  static async findByUuid (uuid, options = {}) {
    const { Patient: PatientModel } = models
    const { attributes = ['id', 'uuid', 'firstName', 'lastName'] } = options

    return await PatientModel.findOne({ where: { uuid }, attributes, raw: true })
  }

  /**
   * Patients linked to a hospital via patient_hospitals junction table.
   * Used by getCorporatePatients.
   */
  static async findAllByHospitalId (hospitalId, options = {}) {
    const { Patient: PatientModel, Hospital: HospitalModel, User: UserModel } = models
    const {
      limit = 10,
      offset = 0,
      search,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
      attributes = ['uuid', 'firstName', 'lastName', 'dateOfBirth', 'email']
    } = options

    const whereClause = {}
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } }
      ]
    }

    return await PatientModel.findAndCountAll({
      where: whereClause,
      attributes,
      include: [
        {
          model: HospitalModel,
          as: 'hospitals',
          where: { id: hospitalId },
          required: true,
          attributes: [],
          through: { attributes: [] }
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['phone'],
          required: false
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
      distinct: true
    })
  }

  /**
   * Patients linked to a doctor via patient_doctors junction table.
   * Used by getDoctorPatients.
   */
  static async findAllByDoctorId (doctorId, options = {}) {
    const { Patient: PatientModel, Doctor: DoctorModel, User: UserModel } = models
    const {
      limit = 10,
      offset = 0,
      search,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
      attributes = ['uuid', 'firstName', 'lastName', 'dateOfBirth', 'email']
    } = options

    const whereClause = {}
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } }
      ]
    }

    return await PatientModel.findAndCountAll({
      where: whereClause,
      attributes,
      include: [
        {
          model: DoctorModel,
          as: 'doctors',
          where: { id: doctorId },
          required: true,
          attributes: [],
          through: { attributes: [] }
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['phone'],
          required: false
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
      distinct: true
    })
  }
}
