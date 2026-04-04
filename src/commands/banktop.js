import { AstraText } from '../astramessages.js'
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
        text: AstraText.banktopEmpty
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
      AstraText.banktopTitle,
      '',
      ...ranking.map(
        (u, i) => `${i + 1}. @${u.jid.split('@')[0]}\n🏦 Banco: *${u.bank}* coins`
      )
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n\n'),
      mentions: ranking.map(v => v.jid)
    })
  }
}
