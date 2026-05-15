function resolveVisitDateRange ({ visitDateFrom, visitDateTo, reportingDateFrom, reportingDateTo }) {
  return {
    from: visitDateFrom || reportingDateFrom,
    to:   visitDateTo   || reportingDateTo
  }
}

export {
  resolveVisitDateRange
}
