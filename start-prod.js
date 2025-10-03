const { spawn, exec } = require('child_process')
const util = require('util')

const execAsync = util.promisify(exec)

async function runCommand(command, description) {
  try {
    console.log(`Starting: ${description}`)
    const { stdout, stderr } = await execAsync(command)

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    console.log(`Completed: ${description}`)
  } catch (error) {
    console.error(`Error during ${description}: ${error.stderr || error.stdout || error.message}`)
    process.exit(1)
  }
}

(async () => {
  try {
    // Step 1: Run migrations
    await runCommand('npm run sequelize db:migrate', 'Database Migration')

    // Step 2: Run seeders
    await runCommand('npm run seed', 'Seeding Data')

    // Step 3: Start the server using `spawn`
    console.log('Starting the server...')
    const server = spawn('node', ['./dist/index.js'], { stdio: 'inherit' })

    // Handle process termination signals
    const shutdown = () => {
      console.log('Shutting down server...')
      server.kill('SIGINT')
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('uncaughtException', (error) => {
      console.error(`Unexpected error: ${error.message}`)
      shutdown()
    })
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`)
    process.exit(1)
  }
})()
