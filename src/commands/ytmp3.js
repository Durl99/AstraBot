import { cleanupDownload, downloadAudio, readDownloadedFile, resolveYouTubeInput } from '../downloads.js'

export default {
  name: 'ytmp3',
  aliases: ['yta', 'ytaudio'],
  description: 'Descarga audio de YouTube por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const input = args.join(' ').trim()

    if (!input) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.ytmp3 enlace* o *.ytmp3 nombre del video*'
      }, { quoted: msg })
    }

    let media = null

    try {
      const target = await resolveYouTubeInput(input)

      await sock.sendMessage(from, {
        text: target.title
          ? `🌌 AstraBot encontro *${target.title}* y esta extrayendo su audio astral...`
          : '🌌 AstraBot esta extrayendo el audio desde la orbita de YouTube...'
      }, { quoted: msg })

      media = await downloadAudio(target.url)
      const buffer = await readDownloadedFile(media.filePath)

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName: media.fileName,
        ptt: false
      }, { quoted: msg })
    } catch (error) {
      console.error('Error ytmp3:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude forjar el audio astral desde ese enlace o busqueda de YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
