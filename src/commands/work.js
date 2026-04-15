import { ensureUser, saveDB } from '../store.js'
import { recordProgressAction } from '../progression.js'
import { getPetPassives } from '../pets.js'

const HOURGLASS = '\u231B'
const TOOLS = '\u{1F6E0}\uFE0F'
const PAW = '\u{1F43E}'
const GALAXY = '\u{1F30C}'
const TROPHY = '\u{1F3C6}'

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
        text: `${HOURGLASS} *TRABAJO EN RECARGA*\n\nDebes esperar *${formatTime(left)}* para volver a trabajar.`
      }, { quoted: msg })
    }

    const amount = Math.floor(Math.random() * 151) + 80
    const job = jobs[Math.floor(Math.random() * jobs.length)]
    const petPassive = getPetPassives(user)
    const petBonus = petPassive.active ? Math.max(0, Math.floor(amount * petPassive.economyMultiplier)) : 0

    user.coins += amount + petBonus
    user.lastWork = now
    const unlocked = recordProgressAction(user, 'work')
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        `${TOOLS} *TRABAJO COMPLETADO*\n\n` +
        `Trabajaste como *${job}* y ganaste *${amount}* coins.\n` +
        `${petBonus > 0 ? `${PAW} Tu companion encontro *${petBonus}* coins extra en la orbita.\n` : ''}` +
        `${GALAXY} AstraBot registro tu jornada orbital.`
    }, { quoted: msg })

    if (unlocked.length) {
      await sock.sendMessage(from, {
        text: unlocked.map(a => `${TROPHY} Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
      }, { quoted: msg })
    }
  }
}
