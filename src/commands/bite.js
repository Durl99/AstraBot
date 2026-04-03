import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '🧛 mordió a',
  '🌙 le clavó una mordida astral a',
  '☄️ atacó con una mordida cósmica a',
  '🪐 dejó marca en'
]

export default {
  name: 'bite',
  aliases: ['morder'],
  description: 'Muerde a alguien',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)
    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres morder.'
      })
    }

    await sock.sendMessage(from, {
      text: `@${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]} 🦷`,
      mentions: [sender, target]
    })
  }
}