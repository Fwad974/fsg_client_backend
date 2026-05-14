class GetDocStatusOverviewPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        total: data.total,
        segments: data.segments
      }
    }
  }
}

export default GetDocStatusOverviewPresenter
