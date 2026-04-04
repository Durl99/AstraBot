import { ensureUser } from '../store.js'
import { syncDailyMissions } from '../progression.js'

export default {
  name: 'missions',
  aliases: ['mision', 'misiones'],
  description: 'Muestra tus misiones diarias astrales',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const user = ensureUser(db, sender)
    const missions = syncDailyMissions(user)

    const lines = [
      '🛰️ *MISIONES DIARIAS ASTRABOT*',
      '',
      ...missions.map((mission, index) => {
        const status = mission.claimed
          ? '✅ Reclamada'
          : mission.progress >= mission.target
            ? '🌟 Lista para reclamar'
            : '⌛ En progreso'

        return `${index + 1}. *${mission.title}*\n${mission.description}\nProgreso: *${mission.progress}/${mission.target}* | Recompensa: *${mission.reward}* coins\nEstado: ${status}`
      }),
      '',
      '🧭 Usa *.claimmission numero* para cobrar una mision completada.'
    ]

    await sock.sendMessage(from, { text: lines.join('\n\n') }, { quoted: msg })
  }
}
