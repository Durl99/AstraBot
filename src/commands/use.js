import { ensureUser, saveDB } from '../store.js'
import { getShopItem, getInventoryAmount, removeItem } from '../economy.js'

function giveXp(user, amount) {
  user.xp += amount

  let levelUps = 0
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100
    user.level += 1
    user.coins += 50
    levelUps++
  }

  return levelUps
}

export default {
  name: 'use',
  aliases: ['usar'],
  description: 'Usa un item de tu inventario',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const itemKey = (args[0] || '').toLowerCase()
    const user = ensureUser(db, sender)
    const item = getShopItem(itemKey)

    if (!item) {
      return sock.sendMessage(from, {
        text: '🧭 Uso correcto: *.use item*\nEjemplo: *.use apple*'
      })
    }

    const amount = getInventoryAmount(user, itemKey)
    if (amount < 1) {
      return sock.sendMessage(from, {
        text: `🎒 No tienes *${itemKey}* en tu inventario.`
      })
    }

    if (!item.usable) {
      return sock.sendMessage(from, {
        text: `${item.emoji} *${item.name}* no se puede usar. Es para presumir en tu inventario.`
      })
    }

    let text = ''
    let levelUps = 0

    if (itemKey === 'apple') {
      removeItem(user, itemKey, 1)
      levelUps = giveXp(user, 25)
      text = '🍎 Usaste una *Manzana Cósmica* y obtuviste *25 XP*.'
    } else if (itemKey === 'potion') {
      removeItem(user, itemKey, 1)
      levelUps = giveXp(user, 80)
      text = '🧪 Usaste una *Poción Astral* y obtuviste *80 XP*.'
    } else if (itemKey === 'crate') {
      removeItem(user, itemKey, 1)
      const coins = Math.floor(Math.random() * 201) + 80
      user.coins += coins
      text = `📦 Abriste una *Caja Galáctica* y encontraste *${coins} coins*.`
    } else if (itemKey === 'crystal') {
      removeItem(user, itemKey, 1)
      const coins = Math.floor(Math.random() * 251) + 120
      user.coins += coins
      levelUps = giveXp(user, 40)
      text = `🔮 Activaste un *Cristal Nebular* y ganaste *${coins} coins* + *40 XP*.`
    } else {
      return sock.sendMessage(from, {
        text: '⚠️ Ese item todavía no tiene un uso definido.'
      })
    }

    saveDB(db)

    if (levelUps > 0) {
      text += `\n\n🌠 Además, ascendiste hasta *nivel ${user.level}*.`
    }

    await sock.sendMessage(from, { text })
  }
}