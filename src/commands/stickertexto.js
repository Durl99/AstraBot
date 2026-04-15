import { imageToWebpWithExif } from '../utils.js'

const GUIDE = '\u{1F9ED}'
const WARN = '\u26A0\uFE0F'

function escapeXml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapText(text = '', size = 44, maxChars = 18) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)

  return lines.slice(0, 6).map((line, index) => ({
    text: line,
    y: 150 + index * size
  }))
}

function buildStickerSvg(text) {
  const lines = wrapText(text)
  const content = lines.map(line => (
    `<text x="256" y="${line.y}" text-anchor="middle">${escapeXml(line.text)}</text>`
  )).join('')

  return `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b1026"/>
        <stop offset="55%" stop-color="#213a75"/>
        <stop offset="100%" stop-color="#f2b76a"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="512" height="512" rx="48" fill="url(#bg)"/>
    <circle cx="256" cy="92" r="54" fill="none" stroke="#ffe8af" stroke-width="10" opacity="0.9"/>
    <circle cx="256" cy="92" r="82" fill="none" stroke="#fff3cf" stroke-width="3" opacity="0.5"/>
    <g fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="700" filter="url(#glow)">
      ${content}
    </g>
    <text x="256" y="474" text-anchor="middle" fill="#fff3cf" font-family="Arial, sans-serif" font-size="24" letter-spacing="4">ASTRA TEXT</text>
  </svg>
  `
}

export default {
  name: 'stickertexto',
  aliases: ['stext', 'attp'],
  description: 'Convierte texto en sticker con aura Astra',
  category: 'tools',
  cooldown: 4,
  async run({ sock, from, args, msg }) {
    const text = args.join(' ').trim()

    if (!text) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE STICKERTEXTO*\n\n` +
          'Usa *.stickertexto tu frase* para forjar un sticker textual astral.\n\n' +
          'Ejemplo:\n' +
          '- *.stickertexto Bad Bunny domina la galaxia*'
      }, { quoted: msg })
    }

    try {
      const svg = buildStickerSvg(text)
      const sticker = await imageToWebpWithExif(Buffer.from(svg), 'AstraBot', 'Astra Text')

      await sock.sendMessage(from, {
        sticker
      }, { quoted: msg })
    } catch (error) {
      console.error('Error stickertexto:', error)
      await sock.sendMessage(from, {
        text: `${WARN} No pude forjar ese sticker textual astral.`
      }, { quoted: msg })
    }
  }
}
