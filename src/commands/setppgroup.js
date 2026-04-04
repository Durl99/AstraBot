import { getContextInfo } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'setppgroup',
  aliases: ['setppgc'],
  description: 'Actualiza la foto orbital del grupo',
  category: 'moderation',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    let targetMsg = null

    if (msg.message?.imageMessage) {
      targetMsg = msg
    } else if (quoted?.imageMessage) {
      targetMsg = { message: quoted }
    }

    if (!targetMsg) {
      return sock.sendMessage(from, { text: AstraText.needImage })
    }

    try {
      const buffer = await sock.downloadMediaMessage(targetMsg)
      await sock.updateProfilePicture(from, buffer)
      await sock.sendMessage(from, { text: AstraText.setPpDone })
    } catch (e) {
      console.error('Error setppgroup:', e)
      await sock.sendMessage(from, {
        text: '⚠️ No pude actualizar la imagen orbital del grupo en esta maniobra astral.'
      })
    }
  }
}
