import { ensureUser, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'
import { getAchievementEntries, getAstralRank, getTotalWealth, syncDailyMissions } from '../progression.js'

export default {
  name: 'profile',
  aliases: ['me', 'perfil'],
  description: 'Muestra el perfil astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg) || sender
    const user = ensureUser(db, target)

    const partnerJid = db.marriages?.[target] || null
    const proposal = db.proposals?.[target] || null
    const partner = partnerJid ? `@${partnerJid.split('@')[0]}` : 'Ninguna'
    const rank = getAstralRank(user)
    const unlockedAchievements = getAchievementEntries(user).filter(entry => entry.unlocked).length
    const missions = syncDailyMissions(user)

    let proposalText = 'Ninguna'
    if (proposal) {
      if (Date.now() > proposal.expiresAt) {
        delete db.proposals[target]
        saveDB(db)
      } else {
        proposalText = `De @${proposal.from.split('@')[0]}`
      }
    }

    const mentions = [target]
    if (partnerJid) mentions.push(partnerJid)
    if (proposal && Date.now() <= proposal.expiresAt) mentions.push(proposal.from)

    await sock.sendMessage(from, {
      text:
        `🌌 *PERFIL ASTRAL DE @${target.split('@')[0]}*\n\n` +
        `🌠 Rango: ${rank.emoji} *${rank.name}*\n` +
        `🎖️ Nivel: *${user.level}*\n` +
        `✨ XP: *${user.xp}*\n` +
        `💸 Coins: *${user.coins}*\n` +
        `🏦 Banco: *${user.bank}*\n` +
        `🫧 Total orbital: *${getTotalWealth(user)}*\n` +
        `🏆 Logros: *${unlockedAchievements}*\n` +
        `🛰️ Misiones de hoy: *${missions.filter(m => m.claimed).length}/${missions.length}* reclamadas\n` +
        `💞 Pareja: *${partner}*\n` +
        `📡 Propuesta: *${proposalText}*`,
      mentions
    })
  }
}
