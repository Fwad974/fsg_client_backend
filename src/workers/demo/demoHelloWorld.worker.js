import '../../libs/setUpGraceFullShutDown'
import WorkerBase from '../../libs/workerBase'

class HelloWorldWorker extends WorkerBase {
  async run () {
    return { message: 'HelloWorld' }
  }
}

export default async (job) => {
  const result = await HelloWorldWorker.run({ job })
  return result
}
