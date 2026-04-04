import { ensureUser } from '../store.js'

export default {
  name: 'banktop',
  aliases: ['topbank'],
  description: 'Muestra el top de banco orbital',
  category: 'fun',
  cooldown: 5,
  async run({ sock, from, db }) {
    const users = Object.keys(db.users || {})

    if (!users.length) {
      return sock.sendMessage(from, {
        text: '🌌 No hay suficientes registros para formar un banktop.'
      })
    }

    const ranking = users
      .map(jid => {
        const user = ensureUser(db, jid)
        return {
          jid,
          bank: user.bank || 0
        }
      })
      .sort((a, b) => b.bank - a.bank)
      .slice(0, 10)

    const lines = [
      '🏦 BANKTOP ORBITAL',
      '',
      ...ranking.map((u, i) => ${i + 1}. @${u.jid.split('@')[0]} — *${u.bank}* coins)
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n'),
      mentions: ranking.map(v => v.jid)
    })
  }
}