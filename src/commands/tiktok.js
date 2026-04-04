import { cleanupDownload, downloadGeneric, readDownloadedFile } from '../downloads.js'

export default {
  name: 'tiktok',
  aliases: ['tt', 'ttdl'],
  description: 'Descarga videos de TikTok por enlace',
  category: 'media',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.tiktok enlace*'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '✨ AstraBot esta capturando ese video desde la nebulosa de TikTok...'
    }, { quoted: msg })

    let media = null

    try {
      media = await downloadGeneric(url, true)
      const buffer = await readDownloadedFile(media.filePath)

      await sock.sendMessage(from, {
        video: buffer,
        fileName: media.fileName,
        caption: `📱 *ASTRA TIKTOK*\n\n${media.title || 'Video de TikTok recuperado por AstraBot.'}`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error tiktok:', error)
      await sock.sendMessage(from, {
        text: '⚠️ No pude traer ese video desde la nebulosa de TikTok.'
      }, { quoted: msg })
    } finally {
      await cleanupDownload(media?.cleanupDir)
    }
  }
}
