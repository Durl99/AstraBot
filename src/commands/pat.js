import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  'acaricio suavemente a',
  'le dio palmadas tiernas a',
  'consintio con energia astral a',
  'mimo con cariño a'
]

export default {
  name: 'pat',
  aliases: ['acariciar'],
  description: 'Acaricia a alguien',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)

    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres acariciar.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: `🥹 @${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]}.`,
      mentions: [sender, target]
    }, { quoted: msg })
  }
}
