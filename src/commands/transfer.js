import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'
import { getTargetUser } from '../utils.js'

export default {
  name: 'transfer',
  aliases: ['pay'],
  description: 'Transfiere coins a otro usuario',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, args, db }) {
    const target = getTargetUser(msg)
    const amount = Number(args[args.length - 1] || 0)

    if (!target || target === sender || !amount || amount < 1) {
      return sock.sendMessage(from, { text: '🧭 Uso correcto: .transfer @usuario 100' })
    }

    const user = ensureUser(db, sender)
    const other = ensureUser(db, target)

    if (user.coins < amount) {
      return sock.sendMessage(from, { text: AstraText.notEnoughCoins })
    }

    user.coins -= amount
    other.coins += amount
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.transferDone(amount, target),
      mentions: [target]
    })
  }
}