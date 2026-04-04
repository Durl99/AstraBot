import { cleanupDownload, downloadGeneric, readDownloadedFile, resolveYouTubeInput } from '../downloads.js'

export default {
  name: 'ytmp4',
  aliases: ['ytv', 'ytvideo'],
  description: 'Descarga video de YouTube por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const input = args.join(' ').trim()

    if (!input) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.ytmp4 enlace* o *.ytmp4 nombre del video*'
      }, { quoted: msg })
    }

    let media = null

    try {
      const target = await resolveYouTubeInput(input)

      await sock.sendMessage(from, {
        text: target.title
          ? `🚀 AstraBot encontro *${target.title}* y esta trayendo su video orbital...`
          : '🚀 AstraBot esta trayendo el video desde la orbita de YouTube...'
      }, { quoted: msg })

      media = await downloadGeneric(target.url, true)
      const buffer = await readDownloadedFile(media.filePath)

      await sock.sendMessage(from, {
        video: buffer,
        fileName: media.fileName,
        caption: `🎬 *ASTRA YTMP4*\n\n${media.title || 'Video orbital listo para descargar.'}`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error ytmp4:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude forjar el video astral desde ese enlace o busqueda de YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
