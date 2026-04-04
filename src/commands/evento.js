import { ensureUser, saveDB } from '../store.js'
import { addItem, getShopItem } from '../economy.js'

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

function giveXp(user, amount) {
  user.xp += amount

  let levelUps = 0
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100
    user.level += 1
    user.coins += 50
    levelUps += 1
  }

  return levelUps
}

export default {
  name: 'evento',
  aliases: ['event', 'meteoro'],
  description: 'Invoca un evento cosmico aleatorio',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg, db }) {
    const user = ensureUser(db, sender)
    const now = Date.now()
    const cooldownMs = 2 * 60 * 60 * 1000
    const left = (user.lastEvent || 0) + cooldownMs - now

    if (left > 0) {
      return sock.sendMessage(from, {
        text: `⌛ *EVENTO EN RECARGA*\n\nDebes esperar *${formatTime(left)}* para volver a invocar un evento cosmico.`
      }, { quoted: msg })
    }

    let levelUps = 0

    const events = [
      () => {
        const amount = Math.floor(Math.random() * 251) + 120
        user.coins += amount
        return `☄️ Una lluvia de meteoritos dejo *${amount}* coins flotando en tu ruta orbital.`
      },
      () => {
        const itemKey = Math.random() < 0.5 ? 'potion' : 'crystal'
        addItem(user, itemKey, 1)
        const item = getShopItem(itemKey)
        return `${item.emoji} Un portal astral materializo *${item.name}* en tu inventario.`
      },
      () => {
        const loss = Math.min(user.coins, Math.floor(Math.random() * 121) + 40)
        user.coins -= loss
        return `🌪️ Una distorsion gravitacional te hizo perder *${loss}* coins en el vacio.`
      },
      () => {
        const xp = Math.floor(Math.random() * 71) + 30
        levelUps = giveXp(user, xp)
        return `🌌 Una aurora nebular te otorgo *${xp} XP* de energia pura.`
      }
    ]

    const eventText = events[Math.floor(Math.random() * events.length)]()
    user.lastEvent = now
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🛰️ *EVENTO COSMICO ACTIVADO*\n\n' +
        `${eventText}\n\n` +
        `${levelUps > 0 ? `🌠 Ascendiste hasta *nivel ${user.level}*.\n\n` : ''}` +
        '✨ AstraBot ya registro la variacion de tu destino orbital.'
    }, { quoted: msg })
  }
}
