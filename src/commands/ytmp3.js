import { cleanupDownload, downloadAudio, readDownloadedFile } from '../downloads.js'

export default {
  name: 'ytmp3',
  aliases: ['yta', 'ytaudio'],
  description: 'Descarga audio de YouTube por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.ytmp3 enlace*'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '🌌 AstraBot esta extrayendo el audio desde la orbita de YouTube...'
    }, { quoted: msg })

    let media = null

    try {
      media = await downloadAudio(url)
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
        text: '⚠️ No pude forjar el audio astral desde ese enlace de YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
