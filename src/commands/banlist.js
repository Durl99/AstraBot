import { ensureBanGroup } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'banlist',
  aliases: [],
  description: 'Lista los objetivos sellados',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, db }) {
    const bans = ensureBanGroup(db, from)
    const ids = Object.keys(bans).filter(id => bans[id])

    if (!ids.length) {
      return sock.sendMessage(from, { text: AstraText.banListEmpty })
    }

    const text = `${AstraText.banListTitle}\n\n${ids.map(id => `• @${id.split('@')[0]}`).join('\n')}`

    await sock.sendMessage(from, {
      text,
      mentions: ids
    })
  }
}