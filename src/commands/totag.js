import { downloadMediaBuffer, getContextInfo } from '../utils.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'totag',
  aliases: [],
  description: 'Retransmite un mensaje citado a toda la orbita',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    if (!quoted) {
      return sock.sendMessage(from, { text: AstraText.needReply })
    }

    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)

    const content = {}
    if (quoted.conversation) content.text = quoted.conversation
    else if (quoted.extendedTextMessage?.text) content.text = quoted.extendedTextMessage.text
    else if (quoted.imageMessage) content.image = await downloadMediaBuffer({ message: quoted })
    else if (quoted.videoMessage) content.video = await downloadMediaBuffer({ message: quoted })
    else if (quoted.stickerMessage) content.sticker = await downloadMediaBuffer({ message: quoted })
    else if (quoted.documentMessage) {
      content.document = await downloadMediaBuffer({ message: quoted })
      content.fileName = quoted.documentMessage.fileName || 'archivo-orbital'
      content.mimetype = quoted.documentMessage.mimetype
    } else {
      return sock.sendMessage(from, {
        text: '⚠️ Ese tipo de mensaje todavia no puedo retransmitirlo a toda la orbita.'
      })
    }

    content.mentions = mentions

    if (quoted.imageMessage?.caption) {
      content.caption = quoted.imageMessage.caption
    }

    if (quoted.videoMessage?.caption) {
      content.caption = quoted.videoMessage.caption
    }

    await sock.sendMessage(from, content)
    await sock.sendMessage(from, { text: AstraText.toTagDone })
  }
}
