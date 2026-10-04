import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, resolve } from 'node:path'

const env = { ...process.env }

// O Java instalado pelo Homebrew não precisa ser registrado no sistema.
if (!env.JAVA_HOME && process.platform === 'darwin') {
  env.JAVA_HOME = [
    '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
  ].find((path) => existsSync(`${path}/bin/java`))
}

if (env.JAVA_HOME) {
  env.PATH = `${env.JAVA_HOME}/bin${delimiter}${env.PATH ?? ''}`
}

const child = spawn(process.execPath, [
  resolve('node_modules/firebase-tools/lib/bin/firebase.js'),
  'emulators:start',
  '--project', 'demo-broadcast',
  '--only', 'auth,firestore,functions',
  ...process.argv.slice(2),
], { stdio: 'inherit', env })

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}

child.on('error', (error) => {
  console.error('Não foi possível iniciar os emuladores:', error.message)
  process.exitCode = 1
})

child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
