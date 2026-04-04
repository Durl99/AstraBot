import { ensureUser } from '../store.js'
import { inventoryEntries } from '../economy.js'

export default {
  name: 'inventory',
  aliases: ['inv', 'mochila'],
  description: 'Muestra tu inventario astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const user = ensureUser(db, sender)
    const items = inventoryEntries(user)

    if (!items.length) {
      return sock.sendMessage(from, {
        text: '🎒 *INVENTARIO ASTRAL*\n\nTu mochila cosmica esta vacia. Ve a la tienda de AstraBot para llenarla de reliquias.'
      })
    }

    const lines = [
      '🎒 *INVENTARIO ASTRAL*',
      '',
      ...items.map(({ item, qty, key }) =>
        `${item?.emoji || '✨'} *${key}*${item?.name ? ` - ${item.name}` : ''}\n📦 Cantidad orbital: *${qty}*`
      )
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n\n')
    })
  }
}
