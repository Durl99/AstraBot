import { ensureGroup, saveDB } from '../store.js'

export default {
  name: 'mute',
  aliases: [],
  description: 'Mutea el bot en este grupo',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, db }) {
    const group = ensureGroup(db, from)
    group.muted = true
    saveDB(db)
    await sock.sendMessage(from, { text: 'AstraBot quedó muteado en este grupo.' })
  }
}