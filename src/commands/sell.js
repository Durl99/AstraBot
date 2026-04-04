import { createListing } from '../market.js'

export default {
  name: 'sell',
  aliases: ['vender'],
  description: 'Publica un item en el mercado entre usuarios',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, msg, db }) {
    const itemKey = (args[0] || '').toLowerCase()
    const qty = Number(args[1] || 0)
    const price = Number(args[2] || 0)

    if (!itemKey || !qty || !price) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.sell item cantidad precio*\nEjemplo: *.sell potion 2 250*'
      }, { quoted: msg })
    }

    const result = createListing(db, sender, itemKey, qty, price)
    if (result.error) {
      return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text:
        '🛒 *OFERTA ASTRAL PUBLICADA*\n\n' +
        `ID: *${result.listing.id}*\n` +
        `${result.item.emoji} Item: *${result.item.name}*\n` +
        `Cantidad: *${result.listing.qty}*\n` +
        `Precio por unidad: *${result.listing.pricePerUnit}* coins`
    }, { quoted: msg })
  }
}
