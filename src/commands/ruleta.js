import { ensureUser, saveDB } from '../store.js'

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

function getColor(number) {
  if (number === 0) return 'verde'
  return RED_NUMBERS.has(number) ? 'rojo' : 'negro'
}

function getParity(number) {
  if (number === 0) return 'cero'
  return number % 2 === 0 ? 'par' : 'impar'
}

export default {
  name: 'ruleta',
  aliases: ['roulette'],
  description: 'Apuesta en la ruleta cosmica',
  category: 'fun',
  cooldown: 5,
  async run({ sock, from, sender, args, msg, db }) {
    const choice = String(args[0] || '').toLowerCase()
    const amount = Number(args[1] || 0)

    if (!choice || !amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.ruleta rojo 100*, *.ruleta par 100* o *.ruleta 7 100*'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    if (user.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 No tienes suficientes coins para entrar a la ruleta cosmica.'
      }, { quoted: msg })
    }

    const spun = Math.floor(Math.random() * 37)
    const color = getColor(spun)
    const parity = getParity(spun)
    const numericChoice = Number(choice)

    let won = false
    let reward = 0

    if (!Number.isNaN(numericChoice) && choice !== '') {
      won = numericChoice === spun
      reward = amount * 8
    } else if (['rojo', 'negro', 'verde'].includes(choice)) {
      won = choice === color
      reward = amount
    } else if (['par', 'impar'].includes(choice)) {
      won = choice === parity
      reward = amount
    } else {
      return sock.sendMessage(from, {
        text: '🧭 Usa una apuesta valida: *rojo*, *negro*, *par*, *impar* o un numero del 0 al 36.'
      }, { quoted: msg })
    }

    let text = ''

    if (won) {
      user.coins += reward
      text =
        '🎡 *RULETA COSMICA*\n\n' +
        `Numero: *${spun}*\n` +
        `Color: *${color}*\n` +
        `Paridad: *${parity}*\n\n` +
        `🌠 Tu apuesta conecto con la órbita. Ganaste *${reward}* coins.`
    } else {
      user.coins -= amount
      text =
        '🎡 *RULETA COSMICA*\n\n' +
        `Numero: *${spun}*\n` +
        `Color: *${color}*\n` +
        `Paridad: *${parity}*\n\n` +
        `🌑 La rueda no giro a tu favor. Perdiste *${amount}* coins.`
    }

    saveDB(db)
    await sock.sendMessage(from, { text }, { quoted: msg })
  }
}
