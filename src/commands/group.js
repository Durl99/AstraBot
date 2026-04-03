import { isBotAdmin } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'group',
  aliases: [],
  description: 'Abre o cierra el portal del grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args }) {
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) {
      return sock.sendMessage(from, { text: AstraText.botNeedAdmin })
    }

    const option = (args[0] || '').toLowerCase()

    if (option === 'open') {
      await sock.groupSettingUpdate(from, 'not_announcement')
      return sock.sendMessage(from, { text: AstraText.groupOpen })
    }

    if (option === 'close') {
      await sock.groupSettingUpdate(from, 'announcement')
      return sock.sendMessage(from, { text: AstraText.groupClose })
    }

    await sock.sendMessage(from, { text: AstraText.invalidUsage('.group open/close') })
  }
}