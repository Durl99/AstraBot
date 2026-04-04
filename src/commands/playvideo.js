import { cleanupDownload, downloadGeneric, readDownloadedFile, resolveYouTubeInput, searchYouTubeResults } from '../downloads.js'
import { getSearchResults, saveSearchResults } from '../searchcache.js'

function formatDuration(seconds = 0) {
  if (!seconds) return 'duracion desconocida'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default {
  name: 'playvideo',
  aliases: ['pv', 'playvid', 'videoplay'],
  description: 'Busca un video en YouTube y lo descarga',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg, sender }) {
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
      let target = null
      const pick = Number(input)

      if (/^\d+$/.test(input)) {
        const saved = getSearchResults('playvideo', sender)
        if (!saved) {
          return sock.sendMessage(from, {
            text: '🌌 No tengo una busqueda reciente en memoria astral. Usa *.playvideo nombre del video* primero.'
          }, { quoted: msg })
        }

        target = saved.results[pick - 1]
        if (!target) {
          return sock.sendMessage(from, {
            text: `🧭 Solo puedes elegir entre 1 y ${saved.results.length} de tu ultima busqueda orbital.`
          }, { quoted: msg })
        }
      } else if (/^https?:\/\//i.test(input)) {
        target = await resolveYouTubeInput(input)
      } else {
        const results = await searchYouTubeResults(input, 5)
        if (!results.length) {
          return sock.sendMessage(from, {
            text: '🌌 No encontre videos en YouTube para esa busqueda astral.'
          }, { quoted: msg })
        }

        saveSearchResults('playvideo', sender, input, results)

        const lines = [
          '🎬 *ASTRA PLAYVIDEO SEARCH*',
          '',
          `Explore la orbita visual de: *${input}*`,
          ...(input.toLowerCase().includes('bad bunny')
            ? ['', '🐰 El nucleo detecto una vibra de Bad Bunny en el cosmos visual. Elige bien ese misil audiovisual.']
            : []),
          '',
          ...results.map(result =>
            `${result.index}. *${result.title}*\n📡 Canal: ${result.channel || 'desconocido'}\n⌛ Duracion: ${formatDuration(result.duration)}`
          ),
          '',
          '🧭 Responde con *.playvideo numero* para elegir tu video.'
        ]

        return sock.sendMessage(from, {
          text: lines.join('\n\n')
        }, { quoted: msg })
      }

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
