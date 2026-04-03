import { ensureUser, saveDB } from '../store.js'

export default {
  name: 'deposit',
  aliases: ['dep'],
  description: 'Deposita coins en tu banco orbital',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const user = ensureUser(db, sender)
    const raw = (args[0] || '').toLowerCase()

    let amount = 0

    if (raw === 'all' || raw === 'todo') {
      amount = user.coins
    } else {
      amount = Number(raw)
    }

    if (!amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.deposit 100* o *.deposit all*'
      })
    }

    if (user.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 No tienes suficientes coins en la cartera para depositar esa cantidad.'
      })
    }

    user.coins -= amount
    user.bank += amount
    saveDB(db)

    await sock.sendMessage(from, {
      text: `🏦 *DEPÓSITO ORBITAL COMPLETADO*\n\nDepositaste *${amount}* coins.\n🪙 Cartera: *${user.coins}*\n🏦 Banco: *${user.bank}*`
    })
  }
}