class AcknowledgeAlertsDownloadPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        acknowledgedCount: data.acknowledgedCount
      }
    }
  }
}

export default AcknowledgeAlertsDownloadPresenter
