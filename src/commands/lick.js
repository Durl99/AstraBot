import { resolveTarget, randomChoice } from '../social.js'

const lines = [
  '👅 lamió a',
  '🌠 dejó una lamida cósmica en',
  '😵 atacó rarísimo a',
  '🪐 incomodó con una lamida astral a'
]

export default {
  name: 'lick',
  aliases: ['lamer'],
  description: 'Lame a alguien en broma',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender)

    if (!target) {
      return sock.sendMessage(from, {
        text: '🧭 Menciona o responde a la persona que quieres lamer.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: 🤨 @${sender.split('@')[0]} ${randomChoice(lines)} @${target.split('@')[0]}.,
      mentions: [sender, target]
    }, { quoted: msg })
  }
}