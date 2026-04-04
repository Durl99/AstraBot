import { cleanupDownload, downloadAudio, readDownloadedFile, resolveYouTubeInput } from '../downloads.js'

export default {
  name: 'play',
  aliases: ['song', 'musica'],
  description: 'Busca una cancion en YouTube y descarga su audio',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const input = args.join(' ').trim()

    if (!input) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO CORRECTO DE PLAY*\n\n' +
          'Usa *.play nombre de la cancion* o *.play enlace*.\n\n' +
          'Ejemplos:\n' +
          '• *.play bad bunny dtmf*\n' +
          '• *.play https://youtu.be/X29taF1exuk*'
      }, { quoted: msg })
    }

    let media = null

    try {
      const target = await resolveYouTubeInput(input)

      await sock.sendMessage(from, {
        text: target.title
          ? `🎵 AstraBot encontro *${target.title}* y esta preparando su audio estelar...`
          : '🎵 AstraBot esta buscando esa cancion en la orbita de YouTube...'
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
      console.error('Error play:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude encontrar o descargar esa cancion desde YouTube.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
