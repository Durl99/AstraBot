import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

const icons = ['🌌', '🪐', '☄️', '🌙', '⭐']

export default {
  name: 'slot',
  aliases: [],
  description: 'Máquina astral de slots',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, args, db }) {
    const amount = Number(args[0] || 0)
    if (!amount || amount < 1) {
      return sock.sendMessage(from, { text: '🧭 Uso correcto: .slot 50' })
    }

    const user = ensureUser(db, sender)
    if (user.coins < amount) {
      return sock.sendMessage(from, { text: AstraText.notEnoughCoins })
    }

    const a = icons[Math.floor(Math.random() * icons.length)]
    const b = icons[Math.floor(Math.random() * icons.length)]
    const c = icons[Math.floor(Math.random() * icons.length)]
    const combo = `${a} ${b} ${c}`

    if (a === b && b === c) {
      const reward = amount * 4
      user.coins += reward
      saveDB(db)
      return sock.sendMessage(from, { text: AstraText.slotWin(reward, combo) })
    }

    if (a === b || b === c || a === c) {
      const reward = amount
      saveDB(db)
      return sock.sendMessage(from, { text: AstraText.slotWin(reward, combo) })
    }

    user.coins -= amount
    saveDB(db)
    await sock.sendMessage(from, { text: AstraText.slotLose(combo) })
  }
}