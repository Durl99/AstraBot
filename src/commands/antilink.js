import { ensureGroup, saveDB } from '../store.js'
import { isGroup, isAdmin, isBotAdmin, getNumberFromJid } from '../utils.js'
import { AstraText } from '../astramessages.js'

const GUIDE = '\u{1F9ED}'
const SHIELD = '\u{1F6E1}\uFE0F'
const WARN = '\u26A0\uFE0F'
const SPARKLES = '\u2728'

function extractGroupInviteCodes(text = '') {
  const matches = [...String(text).matchAll(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/gi)]
  return matches.map(match => match[1]).filter(Boolean)
}

export default {
  name: 'antilink',
  aliases: [],
  description: 'Activa o ajusta el escudo anti-links',
  category: 'group',
  async run({ sock, from, sender, args, db }) {
    if (!isGroup(from)) {
      return sock.sendMessage(from, { text: AstraText.groupOnly })
    }

    const admin = await isAdmin(sock, from, sender)
    if (!admin) {
      return sock.sendMessage(from, { text: AstraText.adminOnly })
    }

    const group = ensureGroup(db, from)
    const value = (args[0] || '').toLowerCase()

    if (!['on', 'off', 'warn', 'kick', 'test'].includes(value)) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE ANTILINK*\n\n` +
          'Usa *.antilink on*, *.antilink off*, *.antilink warn*, *.antilink kick* o *.antilink test*.'
      })
    }

    if (value === 'test') {
      return sock.sendMessage(from, {
        text:
          `${SHIELD} *PRUEBA DE ANTILINK*\n\n` +
          `Escudo: *${group.antilink ? 'activo' : 'apagado'}*\n` +
          `Modo actual: *${group.antilinkMode}*\n\n` +
          'Envia un link de prueba para verificar el comportamiento orbital.'
      })
    }

    if (value === 'warn' || value === 'kick') {
      group.antilink = true
      group.antilinkMode = value
      saveDB(db)

      return sock.sendMessage(from, {
        text:
          `${SHIELD} El escudo anti-links sigue activo en modo *${value}*.\n\n` +
          (value === 'kick'
            ? `${WARN} Los intrusos con links seran expulsados de la orbita.`
            : `${WARN} Los intrusos con links recibiran una advertencia astral.`)
      })
    }

    if (value === 'on') {
      const botAdmin = await isBotAdmin(sock, from)
      if (!botAdmin && group.antilinkMode === 'kick') {
        return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
      }
    }

    group.antilink = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.antilink
        ? `${AstraText.antilinkOn}\n${SPARKLES} Modo orbital actual: *${group.antilinkMode}*.`
        : AstraText.antilinkOff
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

    const inviteCodes = extractGroupInviteCodes(text)
    if (inviteCodes.length) {
      try {
        const currentCode = await sock.groupInviteCode(from)
        if (inviteCodes.every(code => code === currentCode)) {
          return
        }
      } catch {
        // Si no puedo leer el codigo actual, sigo con la proteccion normal.
      }
    }

    if (group.antilinkMode === 'warn') {
      return sock.sendMessage(from, {
        text:
          `${SHIELD} Link detectado en la orbita.\n\n` +
          `@${getNumberFromJid(sender)}, esta constelacion no permite enlaces sin autorizacion.`,
        mentions: [sender]
      })
    }

    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    try {
      await sock.sendMessage(from, {
        text: `${SHIELD} Link detectado. @${getNumberFromJid(sender)} sera expulsado de la orbita.`,
        mentions: [sender]
      })
      await sock.groupParticipantsUpdate(from, [sender], 'remove')
    } catch {
      await sock.sendMessage(from, { text: `${WARN} Detecte un link, pero no pude expulsar al objetivo.` })
    }
  }
}
