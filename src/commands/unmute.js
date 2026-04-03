import { ensureGroup, saveDB } from '../store.js'

export default {
  name: 'unmute',
  aliases: [],
  description: 'Desmutea el bot en este grupo',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, db }) {
    const group = ensureGroup(db, from)
    group.muted = false
    saveDB(db)
    await sock.sendMessage(from, { text: 'AstraBot ya no está muteado en este grupo.' })
  }
}