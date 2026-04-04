import { ensureUser, saveDB } from '../store.js'

export default {
  name: 'register',
  aliases: ['reg', 'registrar'],
  description: 'Registra tu presencia en AstraBot',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, sender, args, db, msg }) {
    const user = ensureUser(db, sender)

    if (user.registered) {
      return sock.sendMessage(from, {
        text:
          '✨ *YA ESTÁS REGISTRADO*\n\n' +
          `Nombre astral: *${user.regName || 'Sin nombre'}*`
      }, { quoted: msg })
    }

    const name = args.join(' ').trim()
    if (!name) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO CORRECTO*\n\n' +
          'Usa: *.register TuNombre*'
      }, { quoted: msg })
    }

    user.registered = true
    user.regName = name.slice(0, 30)
    user.regTime = Date.now()
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🌌 *REGISTRO COMPLETADO*\n\n' +
        `Bienvenido a AstraBot, *${user.regName}*.\n` +
        'Tu señal astral ya fue reconocida.\n\n' +
        'Ahora ya puedes usar el bot.'
    }, { quoted: msg })
  }
}