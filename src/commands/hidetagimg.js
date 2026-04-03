import { getContextInfo } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'hidetagimg',
  aliases: ['htimg'],
  description: 'Envía una imagen mencionando a todos en oculto',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg, args }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    let targetMsg = null

    if (msg.message?.imageMessage) {
      targetMsg = msg
    } else if (quoted?.imageMessage) {
      targetMsg = { message: quoted }
    }

    if (!targetMsg) {
      return sock.sendMessage(from, { text: '🖼️ Envía o responde a una imagen con .hidetagimg' })
    }

    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    const caption = args.join(' ') || '🌌 Señal visual astral.'

    const image = await sock.downloadMediaMessage(targetMsg)

    await sock.sendMessage(from, {
      image,
      caption,
      mentions
    })

    await sock.sendMessage(from, { text: AstraText.hidetagImgDone })
  }
}