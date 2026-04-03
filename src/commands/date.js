import { resolveTarget, randomChoice } from '../social.js'

const places = [
  'una lluvia de estrellas',
  'un paseo por Saturno',
  'una cena en la estación orbital',
  'un vuelo entre constelaciones',
  'una caminata lunar',
  'un picnic sobre una nebulosa'
]

export default {
  name: 'date',
  aliases: ['cita'],
  description: 'Invita a alguien a una cita astral',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)
    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres invitar.'
      })
    }

    const place = randomChoice(places)

    await sock.sendMessage(from, {
      text:
        `💞 *CITA ASTRAL*\n\n` +
        `@${sender.split('@')[0]} invitó a @${target.split('@')[0]} a *${place}*.\n` +
        `La galaxia observa esta jugada...`,
      mentions: [sender, target]
    })
  }
}