import shell from 'shelljs'
import path from 'path'
import fs from 'fs'

const exec = (args, cwd) => {
  let error = [], status = [], pid = [], env = {}
  shell.set('-e')
  const envPath = path.join(cwd, '.env')
  console.log(envPath)
  if (fs.existsSync(envPath)) {
    var dotenv = require('dotenv').config({ path: envPath })
    env = dotenv.parsed
  }
  env['HOME'] = process.env.HOME || process.env.HOMEPATH
  for (var i = 0; i < args.length; i++) {
    const result = shell.exec(args[i], { cwd, env })
    pid.push(result.pid)
    if (result.code !== 0) {
      error.push(result.stderr)
      break
    } else {
      status.push(result.stdout)
    }
  }
  return { pid, status, error }
}

export default { exec }

