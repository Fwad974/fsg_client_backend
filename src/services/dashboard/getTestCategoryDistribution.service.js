import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import ValidateUserHospitalService from '../user/helper/validateUserHospital.service'

const schema = {
  type: 'object',
  properties: {
    year: { type: ['number', 'string'], minimum: 2000, maximum: 2100 }
  },
  additionalProperties: false
}

const constraints = ajv.compile(schema)

export default class GetTestCategoryDistributionService extends ServiceBase {
  get constraints () { return constraints }

  async run () {
    const { logger } = this.context
    const effectiveYear = resolveYear(this.args.year)
    logger.info('GetTestCategoryDistributionService: ', { message: 'Computing test-category monthly distribution', context: { year: JSON.stringify(effectiveYear) } })

    const user = await ValidateUserHospitalService.run({}, this.context)
    logger.info('GetTestCategoryDistributionService: ', { message: 'Hospital link confirmed', context: { user: JSON.stringify(user) } })

    const [rows, availableYears] = await Promise.all([
      TestResultRepository.countByCategoryMonthly(user.hospitalId, effectiveYear),
      TestResultRepository.findAvailableYearsByHospital(user.hospitalId)
    ])
    logger.info('GetTestCategoryDistributionService: ', { message: 'Test category rows and available years fetched', context: { rows: JSON.stringify(rows), availableYears: JSON.stringify(availableYears) } })

    const aggregated = aggregateRowsByMonthAndCategory(rows)
    logger.info('GetTestCategoryDistributionService: ', { message: 'Rows aggregated by month and category', context: { aggregated: JSON.stringify({ categoriesSet: [...aggregated.categoriesSet], countsByMonth: aggregated.countsByMonth, yearTotal: aggregated.yearTotal }) } })

    const { categoriesSet, countsByMonth, yearTotal } = aggregated
    const categories = sortCategoriesAlphabetically(categoriesSet)
    const months = sortMonthsAscending(countsByMonth)

    return { message: 'OK', availableYears, categories, months, yearTotal }
  }
}

const resolveYear = (year) => Number(year) || new Date().getUTCFullYear()

const aggregateRowsByMonthAndCategory = (rows) => {
  const categoriesSet = new Set()
  const countsByMonth = {}
  let yearTotal = 0

  for (const { month, categoryName, count } of rows) {
    if (count <= 0) continue
    categoriesSet.add(categoryName)
    yearTotal += count
    if (!countsByMonth[month]) countsByMonth[month] = {}
    countsByMonth[month][categoryName] = count
  }

  return { categoriesSet, countsByMonth, yearTotal }
}

const sortCategoriesAlphabetically = (categoriesSet) => [...categoriesSet].sort()

const sortMonthsAscending = (countsByMonth) =>
  Object.keys(countsByMonth)
    .map(Number)
    .sort((a, b) => a - b)
    .map(month => ({ month, counts: countsByMonth[month] }))
