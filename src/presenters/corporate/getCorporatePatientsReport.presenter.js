class GetCorporatePatientsReportPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => {
      const docInstance = row.docInstances[0]
      const alert = row.testAlerts?.[0]
      return {
        patientId: row.patient.uuid,
        patientName: [row.patient.firstName, row.patient.lastName].filter(Boolean).join(' '),
        visiteDate: row.createdAt,
        testDone: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
        reportDate: docInstance.releasedDate,
        docInstanceUuid: docInstance.uuid,
        ...(alert ? { alertUuid: alert.uuid, alertType: alert.alertType } : {})
      }
    }) || []

    return {
      message: data.message,
      data: rows,
      count: data.count
    }
  }
}

export default GetCorporatePatientsReportPresenter
