import { ensureUser, saveDB } from '../store.js'

function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

export default {
  name: 'dados',
  aliases: ['dice'],
  description: 'Lanza dados contra AstraBot',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, args, msg, db }) {
    const amount = Number(args[0] || 0)

    if (!amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.dados 75*'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    if (user.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 No tienes suficientes coins para lanzar los dados astrales.'
      }, { quoted: msg })
    }

    const playerRoll = rollDie()
    const botRoll = rollDie()
    let text = ''

    if (playerRoll > botRoll) {
      user.coins += amount
      text =
        '🎲 *DADOS ASTRALES*\n\n' +
        `Tu tirada: *${playerRoll}*\n` +
        `AstraBot: *${botRoll}*\n\n` +
        `✨ Ganaste *${amount}* coins en la mesa orbital.`
    } else if (playerRoll < botRoll) {
      user.coins -= amount
      text =
        '🎲 *DADOS ASTRALES*\n\n' +
        `Tu tirada: *${playerRoll}*\n` +
        `AstraBot: *${botRoll}*\n\n` +
        `🌑 Perdiste *${amount}* coins ante el dado de AstraBot.`
    } else {
      text =
        '🎲 *DADOS ASTRALES*\n\n' +
        `Tu tirada: *${playerRoll}*\n` +
        `AstraBot: *${botRoll}*\n\n` +
        '🪐 Empate nebuloso. Tus coins permanecen intactas.'
    }

    saveDB(db)
    await sock.sendMessage(from, { text }, { quoted: msg })
  }
}
