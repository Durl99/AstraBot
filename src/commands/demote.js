import { isBotAdmin, getTargetUser } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'demote',
  aliases: [],
  description: 'Retira a un usuario del mando estelar',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, msg }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const target = getTargetUser(msg)

    if (!target) {
      return sock.sendMessage(from, { text: AstraText.noTarget })
    }

    await sock.groupParticipantsUpdate(from, [target], 'demote')
    await sock.sendMessage(from, { text: AstraText.userDemoted })
  }
}