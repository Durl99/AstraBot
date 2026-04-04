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

const jobs = [
  'piloto estelar',
  'minero de meteoritos',
  'cartografo galactico',
  'mecanico orbital',
  'mensajero nebular',
  'guardian de constelaciones'
]

export default {
  name: 'work',
  aliases: ['trabajar'],
  description: 'Trabaja para ganar coins astrales',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db, msg }) {
    const user = ensureUser(db, sender)
    const now = Date.now()
    const cd = 60 * 60 * 1000
    const left = user.lastWork + cd - now

    if (left > 0) {
      return sock.sendMessage(from, {
        text: `⌛ *TRABAJO EN RECARGA*\n\nDebes esperar *${formatTime(left)}* para volver a trabajar.`
      }, { quoted: msg })
    }

    const amount = Math.floor(Math.random() * 151) + 80
    const job = jobs[Math.floor(Math.random() * jobs.length)]

    user.coins += amount
    user.lastWork = now
    saveDB(db)

    await sock.sendMessage(from, {
      text: `🛠️ *TRABAJO COMPLETADO*\n\nTrabajaste como *${job}* y ganaste *${amount}* coins.\n🌌 AstraBot registro tu jornada orbital.`
    }, { quoted: msg })
  }
}
