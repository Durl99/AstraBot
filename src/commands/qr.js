import QRCode from 'qrcode'

const GUIDE = '\u{1F9ED}'
const SPARKLES = '\u2728'
const WARN = '\u26A0\uFE0F'

export default {
  name: 'qr',
  aliases: ['codigoqr'],
  description: 'Genera un codigo QR con energia astral',
  category: 'tools',
  cooldown: 3,
  async run({ sock, from, args, msg }) {
    const text = args.join(' ').trim()

    if (!text) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE QR*\n\n` +
          'Usa *.qr texto o enlace* para forjar un codigo QR astral.\n\n' +
          'Ejemplos:\n' +
          '- *.qr https://astrabot.space*\n' +
          '- *.qr Hola desde AstraBot*'
      }, { quoted: msg })
    }

    try {
      const buffer = await QRCode.toBuffer(text, {
        width: 768,
        margin: 2,
        color: {
          dark: '#102042',
          light: '#FFF7E6'
        }
      })

      await sock.sendMessage(from, {
        image: buffer,
        caption: `${SPARKLES} Codigo QR astral forjado para:\n${text}`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error qr:', error)
      await sock.sendMessage(from, {
        text: `${WARN} No pude forjar ese codigo QR astral.`
      }, { quoted: msg })
    }
  }
}
