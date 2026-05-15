class GetPendingActionsPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        rows: (data.rows || []).map(presentRow),
        count: data.count
      }
    }
  }
}

const presentRow = (alert) => ({
  uuid: alert.uuid,
  alertType: alert.alertType,
  relatedTo: `${alert.testResult.patient.firstName} ${alert.testResult.patient.lastName}`,
  testName: alert.testResult.testCategory.testName,
  receivedDate: alert.testResult.createdAt,
  raisedOn: alert.createdAt
})

export default GetPendingActionsPresenter
