export const SHOP_ITEMS = {
  apple: {
    key: 'apple',
    emoji: '\u{1F34E}',
    name: 'Manzana Cosmica',
    price: 40,
    description: 'Te da un pequeno boost de XP.',
    usable: true
  },
  potion: {
    key: 'potion',
    emoji: '\u{1F9EA}',
    name: 'Pocion Astral',
    price: 120,
    description: 'Te da bastante XP.',
    usable: true
  },
  crate: {
    key: 'crate',
    emoji: '\u{1F4E6}',
    name: 'Caja Galactica',
    price: 180,
    description: 'Puede darte coins extra al abrirla.',
    usable: true
  },
  crystal: {
    key: 'crystal',
    emoji: '\u{1F52E}',
    name: 'Cristal Nebular',
    price: 300,
    description: 'Otorga coins y XP.',
    usable: true
  },
  petfood: {
    key: 'petfood',
    emoji: '\u{1F355}',
    name: 'Snack Estelar',
    price: 90,
    description: 'Alimento premium para companions astrales.',
    usable: false
  },
  ring: {
    key: 'ring',
    emoji: '\u{1F48D}',
    name: 'Anillo Estelar',
    price: 500,
    description: 'Item de lujo para presumir en tu inventario.',
    usable: false
  },
  crown: {
    key: 'crown',
    emoji: '\u{1F451}',
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
