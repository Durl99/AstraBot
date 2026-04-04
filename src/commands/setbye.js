import { ensureGroup, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'setbye',
  aliases: [],
  description: 'Cambia el mensaje de despedida astral',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db }) {
    const text = args.join(' ')

    if (!text) {
      return sock.sendMessage(from, {
        text:
          '🧭 Escribe el nuevo mensaje de despedida astral.\n' +
          'Puedes usar *@user* para mencionar y *@group* para el nombre del grupo.'
      })
    }

    const group = ensureGroup(db, from)
    group.byeText = text
    saveDB(db)

    await sock.sendMessage(from, { text: AstraText.byeSet })
  }
}
