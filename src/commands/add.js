import { isBotAdmin } from '../utils.js'

export default {
  name: 'add',
  aliases: [],
  description: 'Agrega un número al grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: 'Debo ser admin para agregar usuarios.' })
    }

    const raw = (args[0] || '').replace(/[^0-9]/g, '')
    if (!raw) {
      return sock.sendMessage(from, { text: 'Escribe un número. Ejemplo: .add 50688887777' })
    }

    const jid = `${raw}@s.whatsapp.net`

    try {
      await sock.groupParticipantsUpdate(from, [jid], 'add')
      await sock.sendMessage(from, { text: `Intenté agregar a ${raw}.` })
    } catch {
      await sock.sendMessage(from, { text: 'No pude agregar ese número.' })
    }
  }
}