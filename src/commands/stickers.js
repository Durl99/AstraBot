import { getContextInfo, imageToWebp } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'sticker',
  aliases: ['s'],
  description: 'Forja una imagen en reliquia astral',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, msg }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    let targetMsg = null

    if (msg.message?.imageMessage) {
      targetMsg = msg
    } else if (quoted?.imageMessage) {
      targetMsg = {
        message: quoted
      }
    }

    if (!targetMsg) {
      return sock.sendMessage(from, { text: AstraText.noImageSticker })
    }

    try {
      const buffer = await sock.downloadMediaMessage(targetMsg)
      const webp = await imageToWebp(buffer)

      await sock.sendMessage(from, {
        sticker: webp
      }, { quoted: msg })

      await sock.sendMessage(from, { text: AstraText.stickerDone }, { quoted: msg })
    } catch (e) {
      console.error('Error sticker:', e)
      await sock.sendMessage(from, { text: '⚠️ No pude forjar esa imagen en sticker astral.' })
    }
  }
}