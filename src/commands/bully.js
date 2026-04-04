import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '😈 empezó a molestar a',
  '🪐 no dejó respirar a',
  '🌙 atormentó con energía astral a',
  '💫 se burló sin piedad de'
]

export default {
  name: 'bully',
  aliases: ['molestar'],
  description: 'Molesta a alguien en broma',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)

    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres molestar.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: 😵 @${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]}.,
      mentions: [sender, target]
    }, { quoted: msg })
  }
}