import { ensureUser, saveDB } from '../store.js'

export default {
  name: 'unregister',
  aliases: ['unreg'],
  description: 'Elimina tu registro astral',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, sender, db, msg }) {
    const user = ensureUser(db, sender)

    if (!user.registered) {
      return sock.sendMessage(from, {
        text: '🌙 No estabas registrado.'
      }, { quoted: msg })
    }

    user.registered = false
    user.regName = ''
    user.regTime = 0
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🫧 *REGISTRO ELIMINADO*\n\n' +
        'Tu presencia astral fue borrada.\n' +
        'Si quieres volver, usa *.register TuNombre*'
    }, { quoted: msg })
  }
}