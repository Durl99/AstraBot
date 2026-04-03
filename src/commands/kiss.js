import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '💋 besó a',
  '🌙 dejó un beso astral en',
  '✨ soltó un beso cósmico a',
  '💫 se acercó y besó a'
]

export default {
  name: 'kiss',
  aliases: ['beso'],
  description: 'Besa a alguien en la órbita',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)
    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres besar.'
      })
    }

    await sock.sendMessage(from, {
      text: `@${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]} 😘`,
      mentions: [sender, target]
    })
  }
}