import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'
import crypto from 'crypto'

function randomSide() {
  const byte = crypto.randomBytes(1)[0]
  return byte % 2 === 0 ? 'cara' : 'cruz'
}

export default {
  name: 'coinflip',
  aliases: ['cf'],
  description: 'Apuesta coins a cara o cruz',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const side = (args[0] || '').toLowerCase()
    const amount = Number(args[1] || 0)

    if (!['cara', 'cruz', 'heads', 'tails'].includes(side) || !amount || amount < 1) {
      return sock.sendMessage(from, { text: '🧭 Uso correcto: .coinflip cara 50' })
    }

    const user = ensureUser(db, sender)
    if (user.coins < amount) {
      return sock.sendMessage(from, { text: AstraText.notEnoughCoins })
    }

    const normalized = side === 'heads' ? 'cara' : side === 'tails' ? 'cruz' : side
    const result = randomSide()

    if (normalized === result) {
      user.coins += amount
      saveDB(db)
      return sock.sendMessage(from, {
        text: AstraText.coinflipWin(amount, result)
      })
    }

    user.coins -= amount
    saveDB(db)
    await sock.sendMessage(from, {
      text: AstraText.coinflipLose(amount, result)
    })
  }
}