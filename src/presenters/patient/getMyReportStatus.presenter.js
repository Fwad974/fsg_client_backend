import { TEST_RESULT_STATUS, DOC_INSTANCE_STATUS } from '../../libs/constants'

const presentStatus = (testResultStatus, docInstanceStatus) => {
  if (testResultStatus === TEST_RESULT_STATUS.DISCARD || testResultStatus === TEST_RESULT_STATUS.REJECTED) return TEST_RESULT_STATUS.REJECTED
  if (docInstanceStatus === DOC_INSTANCE_STATUS.RELEASED) return TEST_RESULT_STATUS.COMPLETED
  return TEST_RESULT_STATUS.IN_PROGRESS
}

class GetMyReportStatusPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => ({
      testName: [row.testCategory?.testName, row.testCategory?.methodology].filter(Boolean).join('-'),
      receivedDate: row.createdAt,
      status: presentStatus(row.status, row.docInstances?.status),
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
