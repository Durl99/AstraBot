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
        text: '🧭 Usa .setbye texto. Puedes usar @user y @group'
      })
    }

    const group = ensureGroup(db, from)
    group.byeText = text
    saveDB(db)

    await sock.sendMessage(from, { text: AstraText.byeSet })
  }
}