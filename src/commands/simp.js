import { resolveTarget, pairPercent } from '../social.js'

export default {
  name: 'simp',
  aliases: [],
  description: 'Mide el nivel simp astral',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, msg }) {
    const target = resolveTarget(msg, sender) || sender
    const percent = pairPercent(target, 'astrabot-simp-meter', 'simp')

    await sock.sendMessage(from, {
      text:
        `🥺 *MEDIDOR SIMP ASTRAL*\n\n` +
        `@${target.split('@')[0]} tiene un nivel simp de *${percent}%* según el radar galáctico.`,
      mentions: [target]
    })
  }
}