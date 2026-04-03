import { ensureBanGroup, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'ban',
  aliases: [],
  description: 'Sella a un usuario para bloquear sus comandos',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, msg, db }) {
    const target = getTargetUser(msg)
    if (!target) {
      return sock.sendMessage(from, { text: AstraText.noTarget })
    }

    const bans = ensureBanGroup(db, from)
    bans[target] = true
    saveDB(db)

    await sock.sendMessage(from, { text: AstraText.banned })
  }
}