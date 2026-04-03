import { resolveTarget, pairPercent } from '../social.js'

export default {
  name: 'gay',
  aliases: [],
  description: 'Mide el nivel gay astral',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender) || sender
    const percent = pairPercent(target, 'astrabot-gay-meter', 'gay')

    await sock.sendMessage(from, {
      text:
        `🌈 *MEDIDOR GAY ASTRAL*\n\n` +
        `@${target.split('@')[0]} tiene un nivel gay de *${percent}%* según los sensores cósmicos.`,
      mentions: [target]
    })
  }
}