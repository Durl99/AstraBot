import { ensureUser } from '../store.js'
import { getAstralRank, getTotalWealth, syncDailyMissions } from '../progression.js'

export default {
  name: 'balance',
  aliases: ['bal'],
  description: 'Consulta tus coins astrales',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const user = ensureUser(db, sender)
    const rank = getAstralRank(user)
    const missions = syncDailyMissions(user)
    const pendingClaims = missions.filter(m => !m.claimed && m.progress >= m.target).length

    await sock.sendMessage(from, {
      text:
        '🪙 *BALANCE ASTRAL*\n\n' +
        `💸 Cartera: *${user.coins}* coins\n` +
        `🏦 Banco: *${user.bank}* coins\n` +
        `🫧 Total orbital: *${getTotalWealth(user)}* coins\n` +
        `🌠 Rango: ${rank.emoji} *${rank.name}*\n` +
        `🎖️ Nivel: *${user.level}*\n` +
        `🛰️ Misiones listas: *${pendingClaims}*`
    })
  }
}
