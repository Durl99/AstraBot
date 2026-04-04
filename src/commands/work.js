import { ensureUser, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'

function formatTime(ms) {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []
  if (h) parts.push(${h}h)
  if (m) parts.push(${m}m)
  if (sec || !parts.length) parts.push(${sec}s)
  return parts.join(' ')
}

export default {
  name: 'rob',
  aliases: ['robar'],
  description: 'Intenta robarle coins a otro usuario',
  category: 'fun',
  groupOnly: true,
  cooldown: 5,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg)

    if (!target || target === sender) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde al objetivo que quieres robar.'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    const victim = ensureUser(db, target)
    const now = Date.now()
    const cd = 2 * 60 * 60 * 1000
    const left = user.lastRob + cd - now

    if ((user.level || 1) < 2) {
      return sock.sendMessage(from, {
        text:
          '🚫 ROBO BLOQUEADO\n\n' +
          'Necesitas ser al menos nivel 2 para intentar robar en la órbita.'
      }, { quoted: msg })
    }

    if (left > 0) {
      return sock.sendMessage(from, {
        text:
          '⌛ ROBO EN RECARGA\n\n' +
          Debes esperar *${formatTime(left)}* antes de volver a intentar un robo.
      }, { quoted: msg })
    }

    user.lastRob = now

    if ((victim.coins || 0) < 100) {
      saveDB(db)
      return sock.sendMessage(from, {
        text:
          '🪙 OBJETIVO POBRE\n\n' +
          'Ese objetivo no tiene suficientes coins como para que el golpe valga la pena.'
      }, { quoted: msg })
    }

    const success = Math.random() < 0.45

    if (success) {
      const amount = Math.min(victim.coins, Math.floor(Math.random() * 401) + 100)
      victim.coins -= amount
      user.coins += amount
      saveDB(db)

      return sock.sendMessage(from, {
        text:
          '🕶️ ROBO ORBITAL EXITOSO\n\n' +
          @${sender.split('@')[0]} le robó *${amount}* coins a @${target.split('@')[0]}.\n +
          'La jugada salió limpia... por ahora.',
        mentions: [sender, target]
      }, { quoted: msg })
    }

    const penalty = Math.min(user.coins || 0, Math.floor(Math.random() * 151) + 50)
    user.coins -= penalty
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🚨 ROBO FALLIDO\n\n' +
        @${sender.split('@')[0]} fue detectado y perdió *${penalty}* coins en la huida.\n +
        'La policía orbital no perdona.',
      mentions: [sender]
    }, { quoted: msg })
  }
}