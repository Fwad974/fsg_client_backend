import '../../libs/setUpGraceFullShutDown'
import WorkerBase from '../../libs/workerBase'
import { sendMail } from '../../helpers/sendMail.helpers'
import config from '../../configs/app.config'

class EmailWorker extends WorkerBase {
  async run () {
    const { email, emailCC, subject, htmlTemplate } = this.args.job.data

    await sendMail({
      from: config.get('urm.fromEmail'),
      to: email,
      cc: emailCC,
      subject: subject,
      html: htmlTemplate
    })

    return { message: `Mail sent to ${email}` }
  }
}

export default async (job) => {
  const result = await EmailWorker.run({ job })
  return result
}
