import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'afk',
  aliases: [],
  description: 'Te marca como ausente en la órbita',
  category: 'group',
  cooldown: 3,
  async run({ sock, from, sender, args, db, msg }) {
    const reason = args.join(' ').trim()

    db.afk[sender] = {
      since: Date.now(),
      reason
    }

    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.afkSet(reason)
    }, { quoted: msg })
  }
}