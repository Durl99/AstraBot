import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '🤗 envolvió a',
  '🌌 abrazó con energía astral a',
  '🪐 apretó fuerte a',
  '💫 lanzó un abrazo cósmico a'
]

export default {
  name: 'hug',
  aliases: ['abrazo'],
  description: 'Abraza a alguien en la órbita',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)
    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres abrazar.'
      })
    }

    await sock.sendMessage(from, {
      text: `@${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]} 💞`,
      mentions: [sender, target]
    })
  }
}