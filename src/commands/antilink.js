import { ensureGroup, saveDB } from '../store.js'
import { isGroup, isAdmin, isBotAdmin, getNumberFromJid } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'antilink',
  aliases: [],
  description: 'Activa o desactiva el escudo anti-links',
  category: 'group',
  async run({ sock, from, sender, args, db }) {
    if (!isGroup(from)) {
      return sock.sendMessage(from, { text: AstraText.groupOnly })
    }

    const admin = await isAdmin(sock, from, sender)
    if (!admin) {
      return sock.sendMessage(from, { text: AstraText.adminOnly })
    }

    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const group = ensureGroup(db, from)
    const value = (args[0] || '').toLowerCase()

    if (!['on', 'off'].includes(value)) {
      return sock.sendMessage(from, { text: AstraText.invalidUsage('.antilink on/off') })
    }

    group.antilink = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.antilink ? AstraText.antilinkOn : AstraText.antilinkOff
    })
  },

  async onMessage({ sock, msg, from, sender, db }) {
    if (!isGroup(from)) return

    const group = ensureGroup(db, from)
    if (!group.antilink) return

    const text = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''
    )

    if (!text) return
    if (!/(https?:\/\/|chat\.whatsapp\.com|wa\.me)/i.test(text)) return

    const admin = await isAdmin(sock, from, sender)
    if (admin) return

    try {
      await sock.sendMessage(from, {
        text: `🛡️ Link detectado. @${getNumberFromJid(sender)} será expulsado de la órbita.`,
        mentions: [sender]
      })
      await sock.groupParticipantsUpdate(from, [sender], 'remove')
    } catch {
      await sock.sendMessage(from, { text: '⚠️ Detecté un link, pero no pude expulsar al objetivo.' })
    }
  }
}