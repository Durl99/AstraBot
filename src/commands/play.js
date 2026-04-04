import { cleanupDownload, downloadAudio, readDownloadedFile, resolveYouTubeInput, searchYouTubeResults } from '../downloads.js'
import { getSearchResults, saveSearchResults } from '../searchcache.js'

function formatDuration(seconds = 0) {
  if (!seconds) return 'duracion desconocida'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default {
  name: 'play',
  aliases: ['song', 'musica'],
  description: 'Busca una cancion en YouTube y descarga su audio',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg, sender }) {
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
      let target = null
      const pick = Number(input)

      if (/^\d+$/.test(input)) {
        const saved = getSearchResults('play', sender)
        if (!saved) {
          return sock.sendMessage(from, {
            text: '🌌 No tengo una busqueda reciente en memoria astral. Usa *.play nombre de la cancion* primero.'
          }, { quoted: msg })
        }

        target = saved.results[pick - 1]
        if (!target) {
          return sock.sendMessage(from, {
            text: `🧭 Solo puedes elegir entre 1 y ${saved.results.length} de tu ultima busqueda astral.`
          }, { quoted: msg })
        }
      } else if (/^https?:\/\//i.test(input)) {
        target = await resolveYouTubeInput(input)
      } else {
        const results = await searchYouTubeResults(input, 5)
        if (!results.length) {
          return sock.sendMessage(from, {
            text: '🌌 No encontre resultados en YouTube para esa busqueda astral.'
          }, { quoted: msg })
        }

        saveSearchResults('play', sender, input, results)

        const lines = [
          '🎵 *ASTRA PLAY SEARCH*',
          '',
          `Busque en la constelacion musical: *${input}*`,
          ...(input.toLowerCase().includes('bad bunny')
            ? ['', '🐰 El radar astral detecto energia de Bad Bunny. Vamos a encontrar ese perreo cosmico.']
            : []),
          '',
          ...results.map(result =>
            `${result.index}. *${result.title}*\n📡 Canal: ${result.channel || 'desconocido'}\n⌛ Duracion: ${formatDuration(result.duration)}`
          ),
          '',
          '🧭 Responde con *.play numero* para elegir tu pista.'
        ]

        return sock.sendMessage(from, {
          text: lines.join('\n\n')
        }, { quoted: msg })
      }

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
