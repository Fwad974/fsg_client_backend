import path from 'path'
import { demoQueue, JOB_DEMO_HELLO_WORLD } from '../../queues/demo.queue'

demoQueue.process(JOB_DEMO_HELLO_WORLD, 1, path.join(__dirname, './demoHelloWorld.worker'))
