import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

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
  name: 'daily',
  aliases: [],
  description: 'Reclama tu recompensa diaria',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const user = ensureUser(db, sender)
    const now = Date.now()
    const cd = 24 * 60 * 60 * 1000
    const left = user.lastDaily + cd - now

    if (left > 0) {
      return sock.sendMessage(from, {
        text: AstraText.cooldownCustom('daily', formatTime(left))
      })
    }

    const amount = 250
    user.coins += amount
    user.lastDaily = now
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.dailyClaimed(amount)
    })
  }
}