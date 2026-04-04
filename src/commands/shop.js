import { SHOP_ITEMS } from '../economy.js'

export default {
  name: 'shop',
  aliases: ['tienda'],
  description: 'Muestra la tienda galactica astral',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from }) {
    const lines = [
      '🛒 *TIENDA ASTRAL DE ASTRA BOT*',
      '',
      '🌌 Reliquias, consumibles y lujos orbitando en el mercado cosmico.',
      '',
      ...Object.values(SHOP_ITEMS).map(
        item =>
          `${item.emoji} *${item.key}* - ${item.name}\n💸 Precio: *${item.price}* coins\n📝 ${item.description}`
      ),
      '',
      '🧭 Usa *.buy item cantidad* para comprar.',
      'Ejemplo: *.buy apple 2*'
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n\n')
    })
  }
}
