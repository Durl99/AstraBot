import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'revoke',
  aliases: [],
  description: 'Regenera el enlace de invitación del grupo',
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
    await sock.sendMessage(from, { text: AstraText.revokeDone })
  }
}