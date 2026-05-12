class GetTestCategoryDistributionPresenter {
  static present (data) {
    if (!data) return null
    return {
      message: data.message || 'OK',
      data: {
        availableYears: data.availableYears,
        categories:     data.categories,
        months:         data.months,
        yearTotal:      data.yearTotal
      }
    }
  }
}

export default GetTestCategoryDistributionPresenter
