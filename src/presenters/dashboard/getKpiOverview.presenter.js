class GetKpiOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        testCount: data.testCount,
        processingRate: data.processingRate,
        pendingAction: data.pendingAction,
        rejectedRate: data.rejectedRate,
        testConducted: data.testConducted
      }
    }
  }
}

export default GetKpiOverviewPresenter
