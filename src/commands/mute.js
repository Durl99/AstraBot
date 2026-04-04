import { AstraText } from '../astramessages.js'
import { ensureGroup, saveDB } from '../store.js'

export default {
  name: 'mute',
  aliases: [],
  description: 'Silencia a AstraBot en este grupo',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, db }) {
    const group = ensureGroup(db, from)
    group.muted = true
    saveDB(db)
    await sock.sendMessage(from, { text: AstraText.muteOn })
  }
}
