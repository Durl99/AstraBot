import { ensureUser, saveDB } from '../store.js'
import { claimMission, syncDailyMissions } from '../progression.js'

export default {
  name: 'claimmission',
  aliases: ['claimm', 'claimmissions', 'reclamarmision'],
  description: 'Reclama la recompensa de una mision diaria',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, msg, db }) {
    const pick = Number(args[0] || 0)
    if (!pick || pick < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Usa *.claimmission numero* para reclamar una mision. Ejemplo: *.claimmission 1*'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    syncDailyMissions(user)
    const result = claimMission(user, pick - 1)

    if (result.error) {
      return sock.sendMessage(from, {
        text: `⚠️ ${result.error}`
      }, { quoted: msg })
    }

    saveDB(db)

    await sock.sendMessage(from, {
      text:
        `🌠 *MISION RECLAMADA*\n\n` +
        `Mision: *${result.mission.title}*\n` +
        `Recompensa: *${result.mission.reward}* coins\n` +
        'AstraBot registro tu avance en la constelacion.'
    }, { quoted: msg })
  }
}
