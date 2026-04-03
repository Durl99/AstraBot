import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'setdesc',
  aliases: [],
  description: 'Actualiza la descripción del grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const text = args.join(' ')
    if (!text) {
      return sock.sendMessage(from, { text: AstraText.invalidUsage('.setdesc nueva descripción') })
    }

    await sock.groupUpdateDescription(from, text)
    await sock.sendMessage(from, { text: AstraText.setDescDone })
  }
}