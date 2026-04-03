export const SHOP_ITEMS = {
  apple: {
    key: 'apple',
    emoji: '🍎',
    name: 'Manzana Cósmica',
    price: 40,
    description: 'Te da un pequeño boost de XP.',
    usable: true
  },
  potion: {
    key: 'potion',
    emoji: '🧪',
    name: 'Poción Astral',
    price: 120,
    description: 'Te da bastante XP.',
    usable: true
  },
  crate: {
    key: 'crate',
    emoji: '📦',
    name: 'Caja Galáctica',
    price: 180,
    description: 'Puede darte coins extra al abrirla.',
    usable: true
  },
  crystal: {
    key: 'crystal',
    emoji: '🔮',
    name: 'Cristal Nebular',
    price: 300,
    description: 'Otorga coins y XP.',
    usable: true
  },
  ring: {
    key: 'ring',
    emoji: '💍',
    name: 'Anillo Estelar',
    price: 500,
    description: 'Item de lujo para presumir en tu inventario.',
    usable: false
  },
  crown: {
    key: 'crown',
    emoji: '👑',
    name: 'Corona Solar',
    price: 900,
    description: 'Puro ego astral. No se usa, se presume.',
    usable: false
  }
}

export function getShopItem(key = '') {
  return SHOP_ITEMS[String(key).toLowerCase()] || null
}

export function getInventoryAmount(user, itemKey) {
  return Number(user.inventory?.[itemKey] || 0)
}

export function addItem(user, itemKey, qty = 1) {
  if (!user.inventory) user.inventory = {}
  if (!user.inventory[itemKey]) user.inventory[itemKey] = 0
  user.inventory[itemKey] += qty
}

export function removeItem(user, itemKey, qty = 1) {
  if (!user.inventory || !user.inventory[itemKey]) return false
  if (user.inventory[itemKey] < qty) return false

  user.inventory[itemKey] -= qty
  if (user.inventory[itemKey] <= 0) {
    delete user.inventory[itemKey]
  }

  return true
}

export function inventoryEntries(user) {
  return Object.entries(user.inventory || {})
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const item = getShopItem(key)
      return {
        key,
        qty,
        item
      }
    })
}