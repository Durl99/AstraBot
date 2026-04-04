import { addItem, getInventoryAmount, getShopItem, removeItem } from './economy.js'
import { ensureUser, saveDB } from './store.js'

function ensureMarket(db) {
  if (!db.market || typeof db.market !== 'object') {
    db.market = { nextId: 1, listings: [] }
  }
  if (typeof db.market.nextId !== 'number') db.market.nextId = 1
  if (!Array.isArray(db.market.listings)) db.market.listings = []
  return db.market
}

export function createListing(db, sender, itemKey, qty, pricePerUnit) {
  const user = ensureUser(db, sender)
  const market = ensureMarket(db)
  const item = getShopItem(itemKey)

  if (!item) {
    return { error: 'Ese item no existe en el mercado astral.' }
  }

  if (!qty || qty < 1 || !pricePerUnit || pricePerUnit < 1) {
    return { error: 'Cantidad y precio deben ser mayores que cero.' }
  }

  if (getInventoryAmount(user, itemKey) < qty) {
    return { error: 'No tienes suficientes items para publicar esa oferta.' }
  }

  removeItem(user, itemKey, qty)

  const listing = {
    id: market.nextId++,
    seller: sender,
    itemKey,
    qty,
    pricePerUnit,
    createdAt: Date.now()
  }

  market.listings.push(listing)
  saveDB(db)
  return { listing, item }
}

export function buyListing(db, sender, listingId) {
  const buyer = ensureUser(db, sender)
  const market = ensureMarket(db)
  const listingIndex = market.listings.findIndex(entry => entry.id === listingId)
  if (listingIndex === -1) {
    return { error: 'No encontre una oferta con ese ID orbital.' }
  }

  const listing = market.listings[listingIndex]
  if (listing.seller === sender) {
    return { error: 'No puedes comprar tu propia oferta astral.' }
  }

  const total = listing.qty * listing.pricePerUnit
  if (buyer.coins < total) {
    return { error: 'No tienes suficientes coins para comprar esa oferta.' }
  }

  const seller = ensureUser(db, listing.seller)
  buyer.coins -= total
  seller.coins += total
  addItem(buyer, listing.itemKey, listing.qty)
  market.listings.splice(listingIndex, 1)
  saveDB(db)

  return { listing, total }
}

export function cancelListing(db, sender, listingId) {
  const user = ensureUser(db, sender)
  const market = ensureMarket(db)
  const listingIndex = market.listings.findIndex(entry => entry.id === listingId)
  if (listingIndex === -1) {
    return { error: 'No encontre una oferta con ese ID orbital.' }
  }

  const listing = market.listings[listingIndex]
  if (listing.seller !== sender) {
    return { error: 'Solo el vendedor puede cancelar esa oferta.' }
  }

  addItem(user, listing.itemKey, listing.qty)
  market.listings.splice(listingIndex, 1)
  saveDB(db)
  return { listing }
}

export function getListings(db, limit = 15) {
  const market = ensureMarket(db)
  return [...market.listings]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit)
}
