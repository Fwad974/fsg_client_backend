class GetCorporatePatientsReportPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => ({
      patientId: row.patient.uuid,
      patientName: [row.patient.firstName, row.patient.lastName].filter(Boolean).join(' '),
      visiteDate: row.createdAt,
      testDone: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
      reportDate: row.docInstances?.releasedDate || null,
      docInstanceUuid: row.docInstances?.uuid || null
    })) || []

    return {
      message: data.message,
      data: rows,
      count: data.count
    }
  }
}

export default GetCorporatePatientsReportPresenter
