const DEFAULT_INTERVAL = 10
const MIN_INTERVAL = 5
const MAX_INTERVAL = 100
const MAX_CORPUS = 250
const MIN_CORPUS_FOR_REPLY = 12
const END = '__END__'
const STOPWORDS = new Set([
  'de', 'la', 'el', 'que', 'y', 'a', 'en', 'un', 'una', 'por', 'para', 'con', 'sin',
  'los', 'las', 'del', 'al', 'se', 'es', 'no', 'si', 'ya', 'yo', 'tu', 'mi', 'te',
  'me', 'lo', 'le', 'su', 'sus', 'pero', 'porque', 'como', 'mas', 'muy', 'esto',
  'esta', 'este', 'eso', 'esa', 'ese', 'hay', 'cuando', 'donde', 'todo', 'nada'
])

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function ensureMarkovState(group) {
  if (!group.markov || typeof group.markov !== 'object') {
    group.markov = {
      enabled: false,
      interval: DEFAULT_INTERVAL,
      pending: 0,
      lastGeneratedAt: 0,
      corpus: []
    }
  }

  const markov = group.markov
  if (typeof markov.enabled !== 'boolean') markov.enabled = false
  if (!Number.isInteger(markov.interval)) markov.interval = DEFAULT_INTERVAL
  markov.interval = clamp(markov.interval, MIN_INTERVAL, MAX_INTERVAL)
  if (!Number.isInteger(markov.pending) || markov.pending < 0) markov.pending = 0
  if (typeof markov.lastGeneratedAt !== 'number') markov.lastGeneratedAt = 0
  if (!Array.isArray(markov.corpus)) markov.corpus = []
  markov.corpus = markov.corpus
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .slice(-MAX_CORPUS)

  return markov
}

export function getMarkovLimits() {
  return {
    defaultInterval: DEFAULT_INTERVAL,
    minInterval: MIN_INTERVAL,
    maxInterval: MAX_INTERVAL,
    minCorpusForReply: MIN_CORPUS_FOR_REPLY
  }
}

export function setMarkovEnabled(group, enabled) {
  const markov = ensureMarkovState(group)
  markov.enabled = Boolean(enabled)
  if (!markov.enabled) markov.pending = 0
  return markov
}

export function setMarkovInterval(group, interval) {
  const markov = ensureMarkovState(group)
  markov.interval = clamp(Number(interval) || DEFAULT_INTERVAL, MIN_INTERVAL, MAX_INTERVAL)
  return markov
}

export function resetMarkov(group) {
  const markov = ensureMarkovState(group)
  markov.pending = 0
  markov.lastGeneratedAt = 0
  markov.corpus = []
  return markov
}

function cleanMarkovInput(text = '', prefix = '.') {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith(prefix)) return ''
  if (/^(https?:\/\/|chat\.whatsapp\.com|wa\.me)/i.test(trimmed)) return ''

  const normalized = trimmed
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/@[0-9]+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,!?"'()\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  if (normalized.length < 12 || wordCount < 3) return ''
  return normalized.slice(0, 240)
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(part => part.trim())
    .filter(Boolean)
}

function tokenize(sentence) {
  return (sentence.match(/[\p{L}\p{N}'-]+/gu) || []).map(token => token.toLowerCase())
}

function extractKeywords(text) {
  return tokenize(text).filter(word => word.length >= 4 && !STOPWORDS.has(word))
}

function buildChain(corpus) {
  const starts = []
  const transitions = new Map()

  for (const text of corpus) {
    for (const sentence of splitSentences(text)) {
      const words = tokenize(sentence)
      if (words.length < 3) continue

      starts.push(words.slice(0, 2))

      for (let i = 0; i < words.length - 2; i++) {
        const key = `${words[i]} ${words[i + 1]}`
        if (!transitions.has(key)) transitions.set(key, [])
        transitions.get(key).push(words[i + 2])
      }

      const lastKey = `${words[words.length - 2]} ${words[words.length - 1]}`
      if (!transitions.has(lastKey)) transitions.set(lastKey, [])
      transitions.get(lastKey).push(END)
    }
  }

  return { starts, transitions }
}

function capitalize(text = '') {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function finalizeGeneratedText(tokens, sourceText = '') {
  const cleaned = []
  for (const token of tokens) {
    if (!cleaned.length || cleaned[cleaned.length - 1] !== token) {
      cleaned.push(token)
    }
  }

  let text = cleaned.join(' ').replace(/\s+([,.!?])/g, '$1').trim()
  text = capitalize(text)

  if (!/[.!?]$/.test(text)) {
    const sourcePunctuation = /[!?]$/.test(sourceText.trim()) ? sourceText.trim().slice(-1) : '.'
    text += sourcePunctuation
  }

  return text
}

function generateMarkovText(corpus, sourceText = '') {
  if (corpus.length < MIN_CORPUS_FOR_REPLY) return null

  const { starts, transitions } = buildChain(corpus)
  if (!starts.length) return null

  const keywords = extractKeywords(sourceText)
  const preferredStarts = keywords.length
    ? starts.filter(pair => keywords.includes(pair[0]) || keywords.includes(pair[1]))
    : []

  for (let attempt = 0; attempt < 8; attempt++) {
    const start = randomItem(preferredStarts.length ? preferredStarts : starts)
    let pair = [...start]
    const tokens = [...pair]
    const maxWords = 28

    while (tokens.length < maxWords) {
      const key = `${pair[0]} ${pair[1]}`
      const nextList = transitions.get(key)
      if (!nextList?.length) break

      const next = randomItem(nextList)
      if (next === END) break

      tokens.push(next)
      pair = [pair[1], next]
    }

    if (tokens.length < 5) continue

    const finalText = finalizeGeneratedText(tokens, sourceText)
    const lowered = finalText.toLowerCase()
    if (!corpus.some(entry => entry.toLowerCase() === lowered)) {
      return finalText
    }
  }

  return capitalize(randomItem(corpus))
}

export function getMarkovSummary(group) {
  const markov = ensureMarkovState(group)
  return {
    enabled: markov.enabled,
    interval: markov.interval,
    pending: markov.pending,
    corpusSize: markov.corpus.length,
    ready: markov.corpus.length >= MIN_CORPUS_FOR_REPLY
  }
}

export function learnAndGenerateMarkov(group, text, prefix = '.') {
  const markov = ensureMarkovState(group)
  if (!markov.enabled) {
    return { changed: false, generated: null, learned: false }
  }

  const cleaned = cleanMarkovInput(text, prefix)
  if (!cleaned) {
    return { changed: false, generated: null, learned: false }
  }

  if (!markov.corpus.length || markov.corpus[markov.corpus.length - 1] !== cleaned) {
    markov.corpus.push(cleaned)
    if (markov.corpus.length > MAX_CORPUS) {
      markov.corpus = markov.corpus.slice(-MAX_CORPUS)
    }
  }

  markov.pending += 1

  if (markov.pending < markov.interval) {
    return { changed: true, generated: null, learned: true }
  }

  const generated = generateMarkovText(markov.corpus, cleaned)
  if (!generated) {
    markov.pending = Math.max(0, markov.interval - 1)
    return { changed: true, generated: null, learned: true }
  }

  markov.pending = 0
  markov.lastGeneratedAt = Date.now()
  return { changed: true, generated, learned: true }
}

export function generateMarkovPreview(group, seedText = '') {
  const markov = ensureMarkovState(group)
  return generateMarkovText(markov.corpus, seedText)
}

