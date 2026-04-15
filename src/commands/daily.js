import { ensureUser, saveDB } from '../store.js'
import { recordProgressAction } from '../progression.js'
import { getPetPassives } from '../pets.js'

const HOURGLASS = '\u231B'
const STAR = '\u{1F320}'
const MONEY_WINGS = '\u{1FA90}'
const SPARKLES = '\u2728'
const PAW = '\u{1F43E}'
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

const rewardTexts = [
  amount =>
    `${STAR} *RECOMPENSA DIARIA ASTRAL*\n\nLa constelacion te favorecio con *${amount}* coins.\nVuelve manana por otra carga cosmica.`,
  amount =>
    `${MONEY_WINGS} *PAGO ORBITAL RECIBIDO*\n\nAstraBot transfirio *${amount}* coins a tu cartera.\nLa orbita reconoce tu presencia.`,
  amount =>
    `${SPARKLES} *BONO COSMICO*\n\nRecibiste *${amount}* coins por mantener tu senal activa dentro de la galaxia.`
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
        text: `${HOURGLASS} *RECOMPENSA EN RECARGA*\n\nDebes esperar *${formatTime(left)}* para volver a reclamar tu daily.`
      }, { quoted: msg })
    }

    const amount = Math.floor(Math.random() * 201) + 250
    const petPassive = getPetPassives(user)
    const petBonus = petPassive.active ? Math.max(0, Math.floor(amount * petPassive.economyMultiplier)) : 0
    user.coins += amount + petBonus
    user.lastDaily = now
    const unlocked = recordProgressAction(user, 'daily')
    saveDB(db)

    let text = rewardTexts[Math.floor(Math.random() * rewardTexts.length)](amount)
    if (petBonus > 0 && petPassive.pet) {
      text += `\n\n${PAW} Tu companion te guio hacia un bonus de *${petBonus}* coins.`
    }
    await sock.sendMessage(from, { text }, { quoted: msg })

    if (unlocked.length) {
      await sock.sendMessage(from, {
        text: unlocked.map(a => `${TROPHY} Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
      }, { quoted: msg })
    }
  }
}
