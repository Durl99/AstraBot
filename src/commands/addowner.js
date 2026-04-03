import fs from 'fs'
import path from 'path'
import { AstraText } from '../astramessages.js'

const ENV_PATH = path.resolve('.env')

export default {
  name: 'addowner',
  aliases: [],
  description: 'Añade un owner por número',
  category: 'owner',
  ownerOnly: true,
  cooldown: 3,
  async run({ sock, from, args, config }) {
    const raw = (args[0] || '').replace(/[^0-9]/g, '')
    if (!raw) {
      return sock.sendMessage(from, { text: '🧭 Uso correcto: .addowner 50688887777' })
    }

    const currentOwners = [...config.owner]
    if (!currentOwners.includes(raw)) {
      currentOwners.push(raw)
    }

    let env = fs.readFileSync(ENV_PATH, 'utf8')

    if (/^OWNER_NUMBER=.*$/m.test(env)) {
      env = env.replace(/^OWNER_NUMBER=.*$/m, `OWNER_NUMBER=${currentOwners.join(',')}`)
    } else {
      env += `\nOWNER_NUMBER=${currentOwners.join(',')}\n`
    }

    fs.writeFileSync(ENV_PATH, env)
    config.owner = currentOwners

    await sock.sendMessage(from, { text: AstraText.ownerAdded(raw) })
  }
}