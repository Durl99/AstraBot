import { ensureWarnings, saveDB } from '../store.js'
import { getTargetUser, isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'warn',
  aliases: [],
  description: 'Registra una advertencia astral',
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
    db.warnings[from][target] = current + 1
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.warnAdded(db.warnings[from][target])
    })

    if (db.warnings[from][target] >= 3) {
      const botAdmin = await isBotAdmin(sock, from)
      await sock.sendMessage(from, {
        text: `☄️ El objetivo alcanzó 3 warnings. AstraBot intentará expulsarlo.`,
        mentions: [target]
      })

      if (botAdmin) {
        try {
          await sock.groupParticipantsUpdate(from, [target], 'remove')
        } catch (e) {
          console.error('Error expulsando por warnings:', e)
        }
      }
    }
  }
}