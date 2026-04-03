import { ensureWarnings } from '../store.js'
import { getTargetUser } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'warnings',
  aliases: ['warns'],
  description: 'Consulta advertencias astrales',
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

    if (!current) {
      return sock.sendMessage(from, { text: AstraText.noWarnings })
    }

    await sock.sendMessage(from, { text: AstraText.warningsList(current) })
  }
}