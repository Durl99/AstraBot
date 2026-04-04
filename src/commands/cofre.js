import { ensureUser, saveDB } from '../store.js'
import { addItem, getShopItem } from '../economy.js'
import { openAstralChest, recordProgressAction } from '../progression.js'

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
  name: 'cofre',
  aliases: ['chest', 'cajaastral'],
  description: 'Abre un cofre astral cada cierto tiempo',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const user = ensureUser(db, sender)
    const result = openAstralChest(user)

    if (result.left) {
      return sock.sendMessage(from, {
        text: `⌛ *COFRE EN RECARGA*\n\nDebes esperar *${formatTime(result.left)}* para volver a abrir un cofre astral.`
      }, { quoted: msg })
    }

    let rewardText = ''

    if (result.reward.type === 'coins') {
      user.coins += result.reward.amount
      rewardText = result.reward.text(result.reward.amount)
    } else if (result.reward.type === 'item') {
      addItem(user, result.reward.itemKey, result.reward.qty)
      const item = getShopItem(result.reward.itemKey)
      rewardText = item
        ? `${item.emoji} El cofre te entrego *${item.name}* x${result.reward.qty}.`
        : result.reward.text()
    }

    const unlocked = recordProgressAction(user, 'chest')
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '📦 *COFRE ASTRAL ABIERTO*\n\n' +
        `${rewardText}\n\n` +
        '🌌 Vuelve mas tarde para abrir otro pulso del cosmos.'
    }, { quoted: msg })

    if (unlocked.length) {
      await sock.sendMessage(from, {
        text: unlocked.map(a => `🏆 Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
      }, { quoted: msg })
    }
  }
}
