import { downloadMediaBuffer, getContextInfo } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'hidetagimg',
  aliases: ['htimg'],
  description: 'Envia una imagen mencionando a todos en oculto',
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
      return sock.sendMessage(from, {
        text: '🖼️ Envia o responde a una imagen con *.hidetagimg* para lanzar una señal visual astral.'
      })
    }

    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    const caption = args.join(' ') || '🌌 Señal visual astral desplegada en toda la orbita.'

    const image = await downloadMediaBuffer(targetMsg)

    await sock.sendMessage(from, {
      image,
      caption,
      mentions
    })

    await sock.sendMessage(from, { text: AstraText.hidetagImgDone })
  }
}
