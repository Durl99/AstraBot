import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '☄️ lanzó a',
  '💥 vaporizó a',
  '🪐 expulsó brutalmente a',
  '🌌 eliminó simbólicamente a'
]

export default {
  name: 'kill',
  aliases: ['matar'],
  description: 'Mata en broma a alguien',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)

    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres eliminar en broma.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: 💀 @${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]} del plano astral.,
      mentions: [sender, target]
    }, { quoted: msg })
  }
}