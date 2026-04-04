import { ensureUser, saveDB } from '../store.js'
import { getShopItem, addItem } from '../economy.js'
import { recordProgressAction } from '../progression.js'

export default {
  name: 'buy',
  aliases: ['comprar'],
  description: 'Compra items de la tienda galactica',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const itemKey = (args[0] || '').toLowerCase()
    const qty = Math.max(1, Number(args[1] || 1))

    const item = getShopItem(itemKey)
    if (!item) {
      return sock.sendMessage(from, {
        text: '🧭 Usa *.buy item cantidad* para comprar en la tienda astral.\nEjemplo: *.buy apple 2*'
      })
    }

    const user = ensureUser(db, sender)
    const total = item.price * qty

    if (user.coins < total) {
      return sock.sendMessage(from, {
        text: `🪙 No tienes suficientes coins astrales.\nNecesitas *${total}* y solo orbitas con *${user.coins}*.`
      })
    }

    user.coins -= total
    addItem(user, item.key, qty)
    const unlocked = recordProgressAction(user, 'buy', { qty })
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🛍️ *COMPRA ASTRAL COMPLETADA*\n\n' +
        `${item.emoji} Compraste *${qty}* x *${item.name}*\n` +
        `💸 Gastaste *${total}* coins\n` +
        `🪙 Coins restantes: *${user.coins}*`
    })

    if (unlocked.length) {
      await sock.sendMessage(from, {
        text: unlocked.map(a => `🏆 Logro desbloqueado: *${a.title}* (+${a.reward} coins)`).join('\n')
      })
    }
  }
}
