import { ensureBanGroup, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'unban',
  aliases: [],
  description: 'Rompe el sello de un usuario bloqueado',
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
    delete bans[target]
    saveDB(db)

    await sock.sendMessage(from, { text: AstraText.unbanned })
  }
}