import { cleanupDownload, downloadGeneric, readDownloadedFile, resolveYouTubeInput } from '../downloads.js'

export default {
  name: 'playvideo',
  aliases: ['pv', 'playvid', 'videoplay'],
  description: 'Busca un video en YouTube y lo descarga',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const input = args.join(' ').trim()

    if (!input) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO CORRECTO DE PLAYVIDEO*\n\n' +
          'Usa *.playvideo nombre del video* o *.playvideo enlace*.\n\n' +
          'Ejemplos:\n' +
          '• *.playvideo bad bunny dtmf*\n' +
          '• *.playvideo https://youtu.be/X29taF1exuk*'
      }, { quoted: msg })
    }

    let media = null

    try {
      const target = await resolveYouTubeInput(input)

      await sock.sendMessage(from, {
        text: target.title
          ? `🎬 AstraBot encontro *${target.title}* y esta preparando su video orbital...`
          : '🎬 AstraBot esta buscando ese video en la orbita de YouTube...'
      }, { quoted: msg })

      media = await downloadGeneric(target.url, true)
      const buffer = await readDownloadedFile(media.filePath)

      await sock.sendMessage(from, {
        video: buffer,
        fileName: media.fileName,
        caption: `🎬 *ASTRA PLAYVIDEO*\n\n${media.title || 'Video orbital listo para descargar.'}`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error playvideo:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude encontrar o descargar ese video desde YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
