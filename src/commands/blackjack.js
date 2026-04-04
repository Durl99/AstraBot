import { ensureUser, saveDB } from '../store.js'

function drawCard() {
  const cards = [
    { label: 'A', value: 11 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
    { label: '9', value: 9 },
    { label: '10', value: 10 },
    { label: 'J', value: 10 },
    { label: 'Q', value: 10 },
    { label: 'K', value: 10 }
  ]

  return cards[Math.floor(Math.random() * cards.length)]
}

function scoreHand(hand) {
  let total = hand.reduce((sum, card) => sum + card.value, 0)
  let aces = hand.filter(card => card.label === 'A').length

  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }

  return total
}

function handText(hand) {
  return hand.map(card => card.label).join(' ')
}

export default {
  name: 'blackjack',
  aliases: ['bj'],
  description: 'Juega blackjack astral contra AstraBot',
  category: 'fun',
  cooldown: 5,
  async run({ sock, from, sender, args, msg, db }) {
    const amount = Number(args[0] || 0)

    if (!amount || amount < 1) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.blackjack 100*'
      }, { quoted: msg })
    }

    const user = ensureUser(db, sender)
    if (user.coins < amount) {
      return sock.sendMessage(from, {
        text: '🪙 No tienes suficientes coins para entrar a la mesa de blackjack astral.'
      }, { quoted: msg })
    }

    const player = [drawCard(), drawCard()]
    const dealer = [drawCard(), drawCard()]
    const playerScore = scoreHand(player)
    let dealerScore = scoreHand(dealer)

    while (dealerScore < 17) {
      dealer.push(drawCard())
      dealerScore = scoreHand(dealer)
    }

    let text = ''

    const playerBlackjack = playerScore === 21 && player.length === 2
    const dealerBlackjack = dealerScore === 21 && dealer.length === 2

    if (playerBlackjack && !dealerBlackjack) {
      const reward = Math.floor(amount * 1.5)
      user.coins += reward
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        `🌠 BLACKJACK perfecto. Ganaste *${reward}* coins.`
    } else if (dealerBlackjack && !playerBlackjack) {
      user.coins -= amount
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        `🌑 AstraBot forjo un blackjack. Perdiste *${amount}* coins.`
    } else if (playerScore > 21) {
      user.coins -= amount
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        `💥 Te pasaste de 21. Perdiste *${amount}* coins.`
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      user.coins += amount
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        `✨ Victoria orbital. Ganaste *${amount}* coins.`
    } else if (playerScore === dealerScore) {
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        '🪐 Empate cosmico. Nadie gana ni pierde.'
    } else {
      user.coins -= amount
      text =
        '🃏 *BLACKJACK ASTRAL*\n\n' +
        `Tu mano: *${handText(player)}* = *${playerScore}*\n` +
        `AstraBot: *${handText(dealer)}* = *${dealerScore}*\n\n` +
        `🌘 AstraBot se llevo la mano. Perdiste *${amount}* coins.`
    }

    saveDB(db)
    await sock.sendMessage(from, { text }, { quoted: msg })
  }
}
