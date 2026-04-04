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
          '✨ *YA ESTAS REGISTRADO EN ASTRA BOT*\n\n' +
          `🌠 Nombre astral: *${user.regName || 'Sin nombre'}*`
      }, { quoted: msg })
    }

    const name = args.join(' ').trim()
    if (!name) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO CORRECTO*\n\n' +
          'Escribe: *.register TuNombreAstral*'
      }, { quoted: msg })
    }

    user.registered = true
    user.regName = name.slice(0, 30)
    user.regTime = Date.now()
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        '🌌 *REGISTRO ASTRAL COMPLETADO*\n\n' +
        `✨ Bienvenido a la constelacion de AstraBot, *${user.regName}*.\n` +
        '🛰️ Tu señal fue reconocida por el nucleo astral.\n\n' +
        '🌠 Ya puedes usar los comandos del bot.'
    }, { quoted: msg })
  }
}
