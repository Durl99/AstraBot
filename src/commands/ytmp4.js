import { cleanupDownload, downloadGeneric, readDownloadedFile } from '../downloads.js'

export default {
  name: 'ytmp4',
  aliases: ['ytv', 'ytvideo'],
  description: 'Descarga video de YouTube por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.ytmp4 enlace*'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '🚀 AstraBot esta trayendo el video desde la orbita de YouTube...'
    }, { quoted: msg })

    let media = null

    try {
      media = await downloadGeneric(url, true)
      const buffer = await readDownloadedFile(media.filePath)

      await sock.sendMessage(from, {
        video: buffer,
        fileName: media.fileName,
        caption: `🎬 *ASTRA YTMP4*\n\n${media.title || 'Video orbital listo para descargar.'}`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error ytmp4:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude forjar el video astral desde ese enlace de YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
