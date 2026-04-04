import { ensureUser } from '../store.js'
import { getAchievementEntries } from '../progression.js'

export default {
  name: 'logros',
  aliases: ['achievements', 'ach'],
  description: 'Muestra tus logros astrales desbloqueados',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const user = ensureUser(db, sender)
    const entries = getAchievementEntries(user)
    const unlockedCount = entries.filter(entry => entry.unlocked).length

    const lines = [
      '🏆 *LOGROS ASTRABOT*',
      '',
      `Desbloqueados: *${unlockedCount}/${entries.length}*`,
      '',
      ...entries.map(entry =>
        `${entry.unlocked ? '✅' : '🌑'} *${entry.title}*\n${entry.description}\nRecompensa: *${entry.reward}* coins`
      )
    ]

    await sock.sendMessage(from, { text: lines.join('\n\n') }, { quoted: msg })
  }
}
