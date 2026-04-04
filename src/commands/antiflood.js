import { AstraText } from '../astramessages.js'
import { ensureGroup, saveDB } from '../store.js'
import { isBotAdmin } from '../utils.js'

export default {
  name: 'antiflood',
  aliases: [],
  description: 'Activa o desactiva el escudo anti-flood',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,

  async run({ sock, from, args, db }) {
    const value = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(value)) {
      return sock.sendMessage(from, { text: AstraText.invalidUsage('.antiflood on/off') })
    }

    const group = ensureGroup(db, from)
    group.antiFlood = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.antiFlood ? AstraText.antifloodOn : AstraText.antifloodOff
    })
  },

  async handleFlood({ sock, from, sender, db }) {
    const group = ensureGroup(db, from)
    if (!group.antiFlood) return

    const botAdmin = await isBotAdmin(sock, from)

    try {
      await sock.sendMessage(from, {
        text: AstraText.floodKick(sender.split('@')[0]),
        mentions: [sender]
      })

      if (botAdmin) {
        await sock.groupParticipantsUpdate(from, [sender], 'remove')
      }
    } catch (e) {
      console.error('No pude actuar contra flood:', e)
    }

    if (db.antiFlood[from]?.[sender]) {
      db.antiFlood[from][sender].timestamps = []
      saveDB(db)
    }
  }
}
