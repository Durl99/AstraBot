import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'
import { getTargetUser } from '../utils.js'
import { recordProgressAction } from '../progression.js'

function formatTime(ms) {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (sec || !parts.length) parts.push(`${sec}s`)
  return parts.join(' ')
}

export default {
  name: 'rob',
  aliases: ['robar'],
  description: 'Intenta robarle coins a alguien',
  category: 'fun',
  groupOnly: true,
  cooldown: 5,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg)
    if (!target || target === sender) {
      return sock.sendMessage(from, { text: '🧭 Menciona o responde al objetivo que quieres robar.' })
    }

    const user = ensureUser(db, sender)
    const victim = ensureUser(db, target)
    const now = Date.now()
    const cd = 2 * 60 * 60 * 1000
    const left = user.lastRob + cd - now

    if (left > 0) {
      return sock.sendMessage(from, {
        text: AstraText.cooldownCustom('rob', formatTime(left))
      })
    }

    user.lastRob = now

    if (victim.coins < 50) {
      saveDB(db)
      return sock.sendMessage(from, { text: '🪙 Ese objetivo no tiene suficientes coins para que valga la pena.' })
    }

    const success = Math.random() < 0.45

    if (success) {
      const amount = Math.min(victim.coins, Math.floor(Math.random() * 151) + 50)
      victim.coins -= amount
      user.coins += amount
      const unlocked = recordProgressAction(user, 'rob', { success: true })
      saveDB(db)
      await sock.sendMessage(from, { text: AstraText.robSuccess(amount) })
      if (unlocked.length) {
        await sock.sendMessage(from, {
          text: unlocked.map(a => `🏆 Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
        })
      }
      return
    }

    const penalty = Math.min(user.coins, Math.floor(Math.random() * 81) + 20)
    user.coins -= penalty
    const unlocked = recordProgressAction(user, 'rob', { success: false })
    saveDB(db)
    await sock.sendMessage(from, { text: AstraText.robFail(penalty) })
    if (unlocked.length) {
      await sock.sendMessage(from, {
        text: unlocked.map(a => `🏆 Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
      })
    }
  }
}
