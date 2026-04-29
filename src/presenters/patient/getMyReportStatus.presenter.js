class GetMyReportStatusPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => ({
      testName: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
      receivedDate: row.createdAt,
      status: row.status,
      estimateDateOfRelease: row.turnAroundTime,
      docInstanceUuid: row.docInstances?.uuid || null
    })) || []

    return {
      message: data.message,
      data: rows,
      count: data.count
    }
  }
}

export default GetMyReportStatusPresenter
