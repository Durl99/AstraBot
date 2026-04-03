import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'resetlink',
  aliases: [],
  description: 'Regenera el portal del grupo y devuelve el nuevo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    await sock.groupRevokeInvite(from)
    const code = await sock.groupInviteCode(from)

    await sock.sendMessage(from, { text: AstraText.resetLinkDone(code) })
  }
}