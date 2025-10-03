import path from 'path'
import { emailQueue, JOB_SEND_MAIL } from '../../queues/email.queue'

emailQueue.process(JOB_SEND_MAIL, 1, path.join(__dirname, './mail.worker'))
