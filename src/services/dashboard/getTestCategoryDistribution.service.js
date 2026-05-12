import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import UserRepository from '../../infrastructure/repositories/userRepository'
import TestResultRepository from '../../infrastructure/repositories/testResultRepository'
import { ACCOUNT_TYPE } from '../../libs/constants'

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
    const { logger, auth: { id: userId } } = this.context
    const effectiveYear = resolveYear(this.args.year)

    logger.info('GetTestCategoryDistributionService: ', {
      message: 'Computing test-category monthly distribution',
      context: { userId: JSON.stringify(userId), year: effectiveYear }
    })

    const owner = await UserRepository.findByIdAndType(userId, ACCOUNT_TYPE.CORPORATE, { attributes: ['hospitalId'] })
    if (!owner?.hospitalId) return this.addError('AccountNotLinkedErrorType')

    const [rows, availableYears] = await Promise.all([
      TestResultRepository.countByCategoryMonthly(owner.hospitalId, effectiveYear),
      TestResultRepository.findAvailableYearsByHospital(owner.hospitalId)
    ])

    const { categoriesSet, countsByMonth, yearTotal } = aggregateRowsByMonthAndCategory(rows)
    const categories = sortCategoriesAlphabetically(categoriesSet)
    const months     = sortMonthsAscending(countsByMonth)

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
