import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'getlink',
  aliases: ['linkgc'],
  description: 'Obtiene el portal actual del grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const code = await sock.groupInviteCode(from)
    await sock.sendMessage(from, { text: AstraText.getLinkDone(code) })
  }
}