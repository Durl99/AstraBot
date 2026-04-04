import { ensureUser, saveDB } from '../store.js'

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

const rewardTexts = [
  amount =>
    `🌠 *RECOMPENSA DIARIA ASTRAL*\n\nLa constelacion te favorecio con *${amount}* coins.\nVuelve mañana por otra carga cosmica.`,
  amount =>
    `🪐 *PAGO ORBITAL RECIBIDO*\n\nAstraBot transfirio *${amount}* coins a tu cartera.\nLa orbita reconoce tu presencia.`,
  amount =>
    `✨ *BONO COSMICO*\n\nRecibiste *${amount}* coins por mantener tu señal activa dentro de la galaxia.`
]

export default {
  name: 'daily',
  aliases: ['diario'],
  description: 'Reclama tu recompensa diaria astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db, msg }) {
    const user = ensureUser(db, sender)
    const now = Date.now()
    const cd = 24 * 60 * 60 * 1000
    const left = user.lastDaily + cd - now

    if (left > 0) {
      return sock.sendMessage(from, {
        text: `⌛ *RECOMPENSA EN RECARGA*\n\nDebes esperar *${formatTime(left)}* para volver a reclamar tu daily.`
      }, { quoted: msg })
    }

    const amount = Math.floor(Math.random() * 201) + 250
    user.coins += amount
    user.lastDaily = now
    saveDB(db)

    const text = rewardTexts[Math.floor(Math.random() * rewardTexts.length)](amount)

    await sock.sendMessage(from, { text }, { quoted: msg })
  }
}
