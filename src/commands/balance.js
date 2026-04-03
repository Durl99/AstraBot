import { ensureUser } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'balance',
  aliases: ['bal'],
  description: 'Consulta tus coins astrales',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const user = ensureUser(db, sender)
    await sock.sendMessage(from, {
      text: AstraText.balance(user.coins, user.bank)
    })
  }
}