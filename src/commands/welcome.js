import { ensureGroup, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'welcome',
  aliases: ['bienvenida'],
  description: 'Activa o desactiva las bienvenidas astrales',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db }) {
    const value = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(value)) {
      return sock.sendMessage(from, { text: AstraText.invalidUsage('.welcome on/off') })
    }

    const group = ensureGroup(db, from)
    group.welcome = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.welcome ? AstraText.welcomeOn : AstraText.welcomeOff
    })
  }
}