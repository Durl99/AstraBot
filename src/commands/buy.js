import { ensureUser, saveDB } from '../store.js'
import { getShopItem, addItem } from '../economy.js'

export default {
  name: 'buy',
  aliases: ['comprar'],
  description: 'Compra items de la tienda galáctica',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const itemKey = (args[0] || '').toLowerCase()
    const qty = Math.max(1, Number(args[1] || 1))

    const item = getShopItem(itemKey)
    if (!item) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.buy item cantidad*\nEjemplo: *.buy apple 2*'
      })
    }

    const user = ensureUser(db, sender)
    const total = item.price * qty

    if (user.coins < total) {
      return sock.sendMessage(from, {
        text: `🪙 No tienes suficientes coins.\nNecesitas *${total}* y solo tienes *${user.coins}*.`
      })
    }

    user.coins -= total
    addItem(user, item.key, qty)
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        `🛍️ *COMPRA COMPLETADA*\n\n` +
        `${item.emoji} Compraste *${qty}* x *${item.name}*\n` +
        `💸 Gastaste *${total}* coins\n` +
        `🪙 Coins restantes: *${user.coins}*`
    })
  }
}