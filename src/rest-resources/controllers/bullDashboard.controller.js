import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { demoQueue } from '../../queues/demo.queue'
import { emailQueue } from '../../queues/email.queue'


/**
 *
 *
 * @export
 * @class DashboardController
 */
export default class BullDashboardController {
  /**
   *
   *
   * @static
   * @return {object}
   * @memberof DashboardController
   */
  static dashboard () {
    const serverAdapter = new ExpressAdapter()

    createBullBoard({
      queues: [
        new BullAdapter(demoQueue),
        new BullAdapter(emailQueue),
      ],
      serverAdapter: serverAdapter
    })

    serverAdapter.setBasePath('/dashboard')
    return serverAdapter.getRouter()
  }
}
