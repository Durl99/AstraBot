import { getContextInfo, imageToWebpWithExif } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'stickerwm',
  aliases: ['swm'],
  description: 'Forja un sticker con firma cósmica',
  category: 'media',
  ownerOnly: true,
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
      return sock.sendMessage(from, { text: AstraText.noStickerImage })
    }

    const joined = args.join(' ')
    const parts = joined.split('|')
    const packname = (parts[0] || 'AstraBot').trim()
    const author = (parts[1] || 'Astra Core').trim()

    try {
      const buffer = await sock.downloadMediaMessage(targetMsg)
      const sticker = await imageToWebpWithExif(buffer, packname, author)

      await sock.sendMessage(from, { sticker }, { quoted: msg })
    } catch (e) {
      console.error('Error stickerwm:', e)
      await sock.sendMessage(from, { text: '⚠️ No pude forjar ese sticker con firma cósmica.' })
    }
  }
}