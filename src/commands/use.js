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
  description: 'Usa un item de tu inventario astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, db }) {
    const itemKey = (args[0] || '').toLowerCase()
    const user = ensureUser(db, sender)
    const item = getShopItem(itemKey)

    if (!item) {
      return sock.sendMessage(from, {
        text: '🧭 Usa *.use item* para activar una reliquia.\nEjemplo: *.use apple*'
      })
    }

    const amount = getInventoryAmount(user, itemKey)
    if (amount < 1) {
      return sock.sendMessage(from, {
        text: `🎒 No tienes *${itemKey}* guardado en tu inventario astral.`
      })
    }

    if (!item.usable) {
      return sock.sendMessage(from, {
        text: `${item.emoji} *${item.name}* no se puede usar. Es una reliquia para presumir en tu orbita.`
      })
    }

    let text = ''
    let levelUps = 0

    if (itemKey === 'apple') {
      removeItem(user, itemKey, 1)
      levelUps = giveXp(user, 25)
      text = '🍎 Usaste una *Manzana Cosmica* y absorbiste *25 XP* del nucleo astral.'
    } else if (itemKey === 'potion') {
      removeItem(user, itemKey, 1)
      levelUps = giveXp(user, 80)
      text = '🧪 Usaste una *Pocion Astral* y ganaste *80 XP* en tu travesia orbital.'
    } else if (itemKey === 'crate') {
      removeItem(user, itemKey, 1)
      const coins = Math.floor(Math.random() * 201) + 80
      user.coins += coins
      text = `📦 Abriste una *Caja Galactica* y encontraste *${coins} coins* flotando en su interior.`
    } else if (itemKey === 'crystal') {
      removeItem(user, itemKey, 1)
      const coins = Math.floor(Math.random() * 251) + 120
      user.coins += coins
      levelUps = giveXp(user, 40)
      text = `🔮 Activaste un *Cristal Nebular* y recibiste *${coins} coins* + *40 XP* del cosmos.`
    } else {
      return sock.sendMessage(from, {
        text: '⚠️ Esa reliquia astral todavia no tiene un efecto definido en AstraBot.'
      })
    }

    saveDB(db)

    if (levelUps > 0) {
      text += `\n\n🌠 Ademas, ascendiste hasta *nivel ${user.level}*.`
    }

    await sock.sendMessage(from, { text })
  }
}
