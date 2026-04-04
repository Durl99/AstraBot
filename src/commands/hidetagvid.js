import { downloadMediaBuffer, getContextInfo } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'hidetagvid',
  aliases: ['htvid'],
  description: 'Envia un video mencionando a todos en oculto',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg, args }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    let targetMsg = null

    if (msg.message?.videoMessage) {
      targetMsg = msg
    } else if (quoted?.videoMessage) {
      targetMsg = { message: quoted }
    }

    if (!targetMsg) {
      return sock.sendMessage(from, {
        text: '🎥 Envia o responde a un video con *.hidetagvid* para lanzar una transmision orbital.'
      })
    }

    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    const caption = args.join(' ') || '🛰️ Transmision visual orbital desplegada en toda la constelacion.'

    const video = await downloadMediaBuffer(targetMsg)

    await sock.sendMessage(from, {
      video,
      caption,
      mentions
    })

    await sock.sendMessage(from, { text: AstraText.hidetagVidDone })
  }
}
