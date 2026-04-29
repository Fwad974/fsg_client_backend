class GetTestCatalogPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => ({
      testName: row.testName,
      testCode: row.testCode,
      turnAroundTime: row.tat
    })) || []

    return {
      message: data.message,
      data: rows,
      count: data.count
    }
  }
}

export default GetTestCatalogPresenter
