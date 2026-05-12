class GetOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        docStatusOverview: data.docStatusOverview,
        statusOverview:    data.statusOverview
      }
    }
  }
}

export default GetOverviewPresenter
