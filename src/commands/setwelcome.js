import { ensureGroup, saveDB } from '../store.js'

export default {
  name: 'setwelcome',
  aliases: [],
  description: 'Cambia el mensaje de bienvenida',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db }) {
    const text = args.join(' ')

    if (!text) {
      return sock.sendMessage(from, {
        text: 'Escribe el nuevo mensaje. Usa @user para mencionar y @group para el nombre del bot.'
      })
    }

    const group = ensureGroup(db, from)
    group.welcomeText = text
    saveDB(db)

    await sock.sendMessage(from, { text: 'Mensaje de bienvenida actualizado.' })
  }
}