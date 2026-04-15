import { extname } from 'path'
import { downloadMediaBuffer, getContextInfo } from '../utils.js'
import { uploadBufferToUrl } from '../services.js'

const GUIDE = '\u{1F9ED}'
const SATURN = '\u{1FAA0}'
const GALAXY = '\u{1F30C}'
const SPARKLES = '\u2728'
const ANTENNA = '\u{1F4E1}'
const WARN = '\u26A0\uFE0F'

function inferFilename(msg) {
  const message = msg?.message || {}

  if (message.imageMessage) return 'astrabot-image.jpg'
  if (message.videoMessage) return 'astrabot-video.mp4'
  if (message.audioMessage) return 'astrabot-audio.mp3'
  if (message.stickerMessage) return 'astrabot-sticker.webp'

  const documentName = message.documentMessage?.fileName
  if (documentName) return documentName

  const mimetype = message.documentMessage?.mimetype || ''
  const fallbackExt = mimetype.includes('/') ? `.${mimetype.split('/')[1]}` : '.bin'
  return `astrabot-file${extname(documentName || '') || fallbackExt}`
}

export default {
  name: 'tourl',
  aliases: ['url', 'subir'],
  description: 'Sube una media y devuelve su enlace orbital',
  category: 'tools',
  cooldown: 5,
  async run({ sock, from, msg }) {
    const ctx = getContextInfo(msg)
    const quoted = ctx?.quotedMessage

    let targetMsg = null

    if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage || msg.message?.stickerMessage) {
      targetMsg = msg
    } else if (quoted) {
      targetMsg = { message: quoted }
    }

    if (!targetMsg) {
      return sock.sendMessage(from, {
        text:
          `${SATURN} *TOURL ASTRAL*\n\n` +
          'Responde a una imagen, video, sticker, audio o documento con *.tourl* para convertirlo en enlace orbital.'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, {
        text: `${GALAXY} AstraBot esta subiendo tu archivo al corredor estelar de enlaces...`
      }, { quoted: msg })

      const buffer = await downloadMediaBuffer(targetMsg)
      const fileName = inferFilename(targetMsg)
      const url = await uploadBufferToUrl(buffer, fileName)

      await sock.sendMessage(from, {
        text:
          `${SPARKLES} *ENLACE ORBITAL GENERADO*\n\n` +
          `${url}\n\n` +
          `${ANTENNA} Puedes compartir esa ruta con toda tu constelacion.`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error tourl:', error)
      await sock.sendMessage(from, {
        text: `${WARN} No pude subir esa media al corredor orbital de enlaces.`
      }, { quoted: msg })
    }
  }
}
