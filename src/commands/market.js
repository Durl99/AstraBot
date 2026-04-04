import { getShopItem } from '../economy.js'
import { buyListing, cancelListing, getListings } from '../market.js'

export default {
  name: 'market',
  aliases: ['mercado'],
  description: 'Explora y usa el mercado entre usuarios',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, msg, db }) {
    const action = (args[0] || 'list').toLowerCase()

    if (action === 'buy' || action === 'comprar') {
      const id = Number(args[1] || 0)
      if (!id) {
        return sock.sendMessage(from, {
          text: '🧭 Usa *.market buy id* para comprar una oferta.'
        }, { quoted: msg })
      }

      const result = buyListing(db, sender, id)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      const item = getShopItem(result.listing.itemKey)
      return sock.sendMessage(from, {
        text:
          '✨ *COMPRA DE MERCADO COMPLETADA*\n\n' +
          `Oferta: *#${result.listing.id}*\n` +
          `${item?.emoji || '📦'} Item: *${item?.name || result.listing.itemKey}*\n` +
          `Cantidad: *${result.listing.qty}*\n` +
          `Total pagado: *${result.total}* coins`
      }, { quoted: msg })
    }

    if (action === 'cancel' || action === 'cancelar') {
      const id = Number(args[1] || 0)
      if (!id) {
        return sock.sendMessage(from, {
          text: '🧭 Usa *.market cancel id* para retirar tu oferta.'
        }, { quoted: msg })
      }

      const result = cancelListing(db, sender, id)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: `🌙 La oferta *#${result.listing.id}* fue retirada del mercado astral.`
      }, { quoted: msg })
    }

    const listings = getListings(db, 15)
    if (!listings.length) {
      return sock.sendMessage(from, {
        text: '🛒 El mercado astral esta vacio por ahora. Usa *.sell* para publicar la primera oferta.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: [
        '🛒 *MERCADO ASTRAL ENTRE USUARIOS*',
        '',
        ...listings.map(listing => {
          const item = getShopItem(listing.itemKey)
          return `#${listing.id} ${item?.emoji || '📦'} *${item?.name || listing.itemKey}*\nCantidad: *${listing.qty}* | Precio: *${listing.pricePerUnit}* c/u\nVendedor: @${listing.seller.split('@')[0]}`
        }),
        '',
        '🧭 Usa *.market buy id* para comprar o *.market cancel id* para retirar tu oferta.'
      ].join('\n\n'),
      mentions: listings.map(listing => listing.seller)
    }, { quoted: msg })
  }
}
