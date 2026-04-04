import { ensureUser } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'leaderboard',
  aliases: ['top', 'lb'],
  description: 'Muestra el top galactico de riqueza y nivel',
  category: 'fun',
  cooldown: 5,
  async run({ sock, from, db }) {
    const users = Object.keys(db.users || {})

    if (!users.length) {
      return sock.sendMessage(from, {
        text: AstraText.leaderboardEmpty
      })
    }

    const ranking = users
      .map(jid => {
        const user = ensureUser(db, jid)
        return {
          jid,
          level: user.level || 1,
          xp: user.xp || 0,
          coins: user.coins || 0,
          bank: user.bank || 0,
          total: (user.coins || 0) + (user.bank || 0)
        }
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        if (b.level !== a.level) return b.level - a.level
        return b.xp - a.xp
      })
      .slice(0, 10)

    const lines = [
      AstraText.leaderboardTitle,
      '',
      ...ranking.map(
        (user, i) =>
          `${i + 1}. @${user.jid.split('@')[0]}\n🪙 Total: *${user.total}* | 💠 Nivel: *${user.level}*`
      )
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n\n'),
      mentions: ranking.map(v => v.jid)
    })
  }
}
