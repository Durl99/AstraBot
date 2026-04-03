import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'public',
  aliases: [],
  description: 'Abre la señal astral a todos',
  category: 'owner',
  ownerOnly: true,
  cooldown: 2,
  async run({ sock, from, db }) {
    db.bot.public = true
    saveDB(db)
    await sock.sendMessage(from, { text: AstraText.publicOn })
  }
}