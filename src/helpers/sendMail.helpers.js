import { URMEmailService } from '../libs/urmEmailService'
import Logger from '../libs/logger'

export const sendMail = async ({ from, to, cc, subject, html }) => {
  try {
    const result = await URMEmailService.sendMail({
      from,
      to,
      cc,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '')
    })

    Logger.info('SendMail', { message: `Response: ${JSON.stringify(result)}` })
    return result
  } catch (error) {
    Logger.info('SendMail', { message: `Error: ${error}` })
  }
}
