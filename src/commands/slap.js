import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '🖐️ le soltó una cachetada orbital a',
  '☄️ golpeó con furia estelar a',
  '💥 mandó una bofetada astral a',
  '🌌 estampó una cachetada en'
]

export default {
  name: 'slap',
  aliases: ['cachetada'],
  description: 'Le da una cachetada astral a alguien',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)
    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres cachetear.'
      })
    }

    await sock.sendMessage(from, {
      text: `@${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]} 😵`,
      mentions: [sender, target]
    })
  }
}