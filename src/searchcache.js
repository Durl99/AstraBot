const SEARCH_TTL_MS = 10 * 60 * 1000

const searchCache = new Map()

function keyFor(kind, sender) {
  return `${kind}:${sender}`
}

export function saveSearchResults(kind, sender, query, results) {
  searchCache.set(keyFor(kind, sender), {
    query,
    results,
    expiresAt: Date.now() + SEARCH_TTL_MS
  })
}

export function getSearchResults(kind, sender) {
  const entry = searchCache.get(keyFor(kind, sender))
  if (!entry) return null

  if (entry.expiresAt < Date.now()) {
    searchCache.delete(keyFor(kind, sender))
    return null
  }

  return entry
}
