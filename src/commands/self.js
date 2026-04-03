import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'self',
  aliases: [],
  description: 'Restringe la señal al owner',
  category: 'owner',
  ownerOnly: true,
  cooldown: 2,
  async run({ sock, from, db }) {
    db.bot.public = false
    saveDB(db)
    await sock.sendMessage(from, { text: AstraText.selfOn })
  }
}