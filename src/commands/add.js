import { AstraText } from '../astramessages.js'
import { isBotAdmin } from '../utils.js'

export default {
  name: 'add',
  aliases: [],
  description: 'Agrega un numero a la orbita del grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const raw = (args[0] || '').replace(/[^0-9]/g, '')
    if (!raw) {
      return sock.sendMessage(from, {
        text: '🧭 Escribe un numero valido.\nEjemplo: *.add 50688887777*'
      })
    }

    const jid = `${raw}@s.whatsapp.net`

    try {
      await sock.groupParticipantsUpdate(from, [jid], 'add')
      await sock.sendMessage(from, { text: AstraText.addTried(raw) })
    } catch {
      await sock.sendMessage(from, { text: AstraText.addFailed })
    }
  }
}
