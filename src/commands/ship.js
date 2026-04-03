import crypto from 'crypto'
import { getTargetUser } from '../utils.js'

function compatibility(a, b) {
  const sorted = [a, b].sort().join('|')
  const hash = crypto.createHash('sha256').update(sorted).digest('hex')
  const num = parseInt(hash.slice(0, 8), 16)
  return num % 101
}

function getVerdict(score) {
  if (score >= 95) return '💍 Destino cósmico absoluto.'
  if (score >= 80) return '✨ La galaxia aprueba esta unión.'
  if (score >= 60) return '🌌 Hay una química astral fuerte.'
  if (score >= 40) return '🪐 Puede funcionar si alinean las órbitas.'
  if (score >= 20) return '🌙 La señal se siente inestable.'
  return '☄️ La galaxia recomienda evacuar.'
}

export default {
  name: 'ship',
  aliases: [],
  description: 'Calcula compatibilidad astral entre dos personas',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = getTargetUser(msg)

    if (!target || target === sender) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona con la que quieres medir compatibilidad.'
      })
    }

    const score = compatibility(sender, target)
    const verdict = getVerdict(score)

    await sock.sendMessage(from, {
      text:
        `💞 *SHIP ASTRAL*\n\n` +
        `@${sender.split('@')[0]} × @${target.split('@')[0]}\n` +
        `Compatibilidad: *${score}%*\n\n` +
        `${verdict}`,
      mentions: [sender, target]
    })
  }
}