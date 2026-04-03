import { SHOP_ITEMS } from '../economy.js'

export default {
  name: 'shop',
  aliases: ['tienda'],
  description: 'Muestra la tienda galáctica',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from }) {
    const lines = [
      '🛒 *TIENDA GALÁCTICA*',
      '',
      ...Object.values(SHOP_ITEMS).map(item =>
        `${item.emoji} *${item.key}* — ${item.name}\n💰 ${item.price} coins\n📝 ${item.description}`
      ),
      '',
      '🧭 Usa *.buy item cantidad*',
      'Ejemplo: *.buy apple 2*'
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n\n')
    })
  }
}