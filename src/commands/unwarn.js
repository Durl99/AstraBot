import { ensureWarnings, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'unwarn',
  aliases: [],
  description: 'Disipa una advertencia astral',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, msg, db }) {
    const target = getTargetUser(msg)
    if (!target) {
      return sock.sendMessage(from, { text: AstraText.noTarget })
    }

    const current = ensureWarnings(db, from, target)
    db.warnings[from][target] = Math.max(0, current - 1)
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.warnRemoved(db.warnings[from][target])
    })
  }
}