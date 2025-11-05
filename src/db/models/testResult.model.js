'use strict'

export default (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
   id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    individualId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'individual_id'
    },
    corporateId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'corporate_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'doctor_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'code'
    },
    turnAroundTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'turn_around_time'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    sample: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'sample'
    },
    tubeType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'tube_type'
    },
    sampleQTY: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sample_qty'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration'
    },
    resultingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resulting_date'
    },
    serviceCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'service_category'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    errorType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'error_type'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    fileUuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      unique: true,
      field: 'file_uuid'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name'
    },
    isReferral: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_referral'
    },
    sampleReferralDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sample_referral_date'
    },
    labId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'lab_id'
    },
    referralLab: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referral_lab'
    },
    sampleTypeForSend: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'sample_type_for_send'
    },
    totalNumberOfSamples: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_number_of_samples'
    },
    receivedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'received_by'
    },
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'received_date'
    },
    sendBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'send_by'
    },
    driver: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'driver'
    },
    sampleReceiptDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sample_receipt_date'
    },
    reasonForRejection: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason_for_rejection'
    },
    rejectedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'rejected_by'
    },
    actionTaken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'action_taken'
    },
    notifiedPerson: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'notified_person'
    },
    notifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'notified_by'
    },
    notifiedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'notified_date'
    },
    disposalDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'disposal_date'
    },
    retentionPeriod: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'retention_period'
    },
    slot: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'slot'
    },
    container: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'container'
    },
    compartment: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'compartment'
    },
    equipmentUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'equipment_unit'
    },
    storageLocation: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'storage_location'
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'patient_id'
    },
    sampleBatchReferralId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'sample_batch_referral_id'
    },
    chainOfCustody: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'chain_of_custody'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks'
    },
    CfDNAExtractionBatchNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cf_dna_extraction_batch_number'
    },
    qcCondition: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'qc_condition'
    },
    cfDNAStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cf_dna_status'
    },
    isolatedPlasmaVolume: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'isolated_plasma_volume'
    },
    plasmaColor: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'plasma_color'
    },
    totalVolumePrimaryTube: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'total_volume_primary_tube'
    },
    cfDNAExtractionBatchId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'cf_dna_extraction_batch_id'
    },
    mode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mode'
    },
    cfDNAVolume: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cf_dna_volume'
    },
    cfDNAExtractionQCStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cf_dna_extraction_qc_status'
    },
    libraryPreparationBatchNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'library_preparation_batch_number'
    },
    wellPosition: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'well_position'
    },
    barcodeNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'barcode_number'
    },
    libraryCon: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'library_con'
    },
    libraryPreparationStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'library_preparation_status'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'test_results',
    schema: 'public',
    timestamps: true
  })

  TestResult.associate = models => {
    TestResult.belongsTo(models.Individual, {
      foreignKey: 'individualId',
      as: 'individual'
    })

    TestResult.belongsTo(models.Corporate, {
      foreignKey: 'corporateId',
      as: 'corporate'
    })

    TestResult.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
  }

  return TestResult
}
