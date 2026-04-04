import { ensureGroup, saveDB } from '../store.js'

export default {
  name: 'setwelcome',
  aliases: [],
  description: 'Cambia el mensaje de bienvenida astral',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db }) {
    const text = args.join(' ')

    if (!text) {
      return sock.sendMessage(from, {
        text:
          '🧭 Escribe el nuevo mensaje de bienvenida astral.\n' +
          'Puedes usar *@user* para mencionar y *@group* para el nombre del grupo.'
      })
    }

    const group = ensureGroup(db, from)
    group.welcomeText = text
    saveDB(db)

    await sock.sendMessage(from, {
      text: '✨ El mensaje de bienvenida astral fue recalibrado correctamente.'
    })
  }
}
