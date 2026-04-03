import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'setname',
  aliases: [],
  description: 'Recalibra el nombre del grupo',
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
      return sock.sendMessage(from, { text: AstraText.invalidUsage('.setname nuevo nombre') })
    }

    await sock.groupUpdateSubject(from, text)
    await sock.sendMessage(from, { text: AstraText.setNameDone })
  }
}