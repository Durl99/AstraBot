import { cleanupDownload, downloadGeneric, readDownloadedFile } from '../downloads.js'

export default {
  name: 'instagram',
  aliases: ['ig', 'igdl'],
  description: 'Descarga contenido de Instagram por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.instagram enlace*'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '🌠 AstraBot esta interceptando la señal de Instagram...'
    }, { quoted: msg })

    let media = null

    try {
      media = await downloadGeneric(url, false)
      const buffer = await readDownloadedFile(media.filePath)

      if (media.kind === 'image') {
        await sock.sendMessage(from, {
          image: buffer,
          caption: `📸 *ASTRA INSTAGRAM*\n\n${media.title || 'Contenido de Instagram recuperado por AstraBot.'}`
        }, { quoted: msg })
      } else if (media.kind === 'audio') {
        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: 'audio/mpeg',
          fileName: media.fileName,
          ptt: false
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: buffer,
          fileName: media.fileName,
          caption: `📸 *ASTRA INSTAGRAM*\n\n${media.title || 'Contenido de Instagram recuperado por AstraBot.'}`
        }, { quoted: msg })
      }
    } catch (error) {
      console.error('Error instagram:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude recuperar ese contenido desde la orbita de Instagram.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
