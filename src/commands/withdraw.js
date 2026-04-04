import { ensureUser, saveDB } from '../store.js'

export default {
  name: 'withdraw',
  aliases: ['with', 'retirar'],
  description: 'Retira coins de tu banco orbital',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const user = ensureUser(db, sender)
    const raw = (args[0] || '').toLowerCase()

    let amount = 0

    if (raw === 'all' || raw === 'todo') {
      amount = user.bank
    } else {
      amount = Number(raw)
    }

    if (!amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Usa *.withdraw 100* o *.withdraw all* para retirar desde tu banco orbital.'
      })
    }

    if (user.bank < amount) {
      return sock.sendMessage(from, {
        text: '🏦 No tienes suficientes coins en el banco orbital para retirar esa cantidad.'
      })
    }

    user.bank -= amount
    user.coins += amount
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '💸 *RETIRO ORBITAL COMPLETADO*\n\n' +
        `Recuperaste *${amount}* coins desde tu banco.\n` +
        `🪙 Cartera astral: *${user.coins}*\n` +
        `🏦 Banco orbital: *${user.bank}*`
    })
  }
}
