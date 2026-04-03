import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'divorce',
  aliases: [],
  description: 'Rompe un vínculo astral',
  category: 'fun',
  cooldown: 5,
  async run({ sock, from, sender, db }) {
    const partner = db.marriages[sender]
    if (!partner) {
      return sock.sendMessage(from, { text: AstraText.noMarriage })
    }

    delete db.marriages[sender]
    delete db.marriages[partner]
    saveDB(db)

    await sock.sendMessage(from, { text: AstraText.divorceDone })
  }
}