import { ensureUser, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'

export default {
  name: 'duel',
  aliases: ['duelo'],
  description: 'Apuesta coins en un duelo simple contra otro usuario',
  category: 'fun',
  groupOnly: true,
  cooldown: 5,
  async run({ sock, from, sender, msg, args, db }) {
    const target = getTargetUser(msg)
    const amount = Number(args[args.length - 1] || 0)

    if (!target || target === sender || !amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: .duel @usuario 100'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    const enemy = ensureUser(db, target)

    if (user.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 No tienes suficientes coins para iniciar ese duelo.'
      }, { quoted: msg })
    }

    if (enemy.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 El objetivo no tiene suficientes coins para cubrir esa apuesta.'
      }, { quoted: msg })
    }

    const winner = Math.random() < 0.5 ? sender : target
    const loser = winner === sender ? target : sender

    const winUser = ensureUser(db, winner)
    const loseUser = ensureUser(db, loser)

    loseUser.coins -= amount
    winUser.coins += amount
    saveDB(db)

    await sock.sendMessage(from, {
      text:
        `⚔️ *DUELO ASTRAL*\n\n` +
        `Apuesta: *${amount}* coins\n` +
        `Ganador: @${winner.split('@')[0]}\n` +
        `Perdedor: @${loser.split('@')[0]}\n\n` +
        'La orbita eligio a su campeon.',
      mentions: [winner, loser]
    }, { quoted: msg })
  }
}
