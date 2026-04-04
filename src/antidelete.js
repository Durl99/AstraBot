import { ensureGroup } from './store.js'
import { getNumberFromJid, getTextMessage } from './utils.js'

const MAX_CACHE_SIZE = 500
const MAX_CACHE_AGE_MS = 1000 * 60 * 60
const messageCache = new Map()

function normalizeKeyPart(value = '') {
  return String(value || '')
}

function getMessageKeys(key = {}) {
  const remoteJid = normalizeKeyPart(key.remoteJid)
  const participant = normalizeKeyPart(key.participant || key.remoteJid)
  const id = normalizeKeyPart(key.id)

  return [
    [remoteJid, participant, id].filter(Boolean).join(':'),
    [remoteJid, id].filter(Boolean).join(':'),
    [participant, id].filter(Boolean).join(':'),
    id
  ].filter(Boolean)
}

function cleanupCache() {
  const now = Date.now()

  for (const [cacheKey, entry] of messageCache.entries()) {
    if (now - entry.createdAt > MAX_CACHE_AGE_MS) {
      messageCache.delete(cacheKey)
    }
  }

  while (messageCache.size > MAX_CACHE_SIZE) {
    const oldestKey = messageCache.keys().next().value
    if (!oldestKey) break
    messageCache.delete(oldestKey)
  }
}

function describeMessage(msg) {
  const message = msg?.message || {}

  if (message.imageMessage) return 'imagen'
  if (message.videoMessage) return 'video'
  if (message.audioMessage) return 'audio'
  if (message.stickerMessage) return 'sticker'
  if (message.documentMessage) return 'documento'
  if (message.conversation || message.extendedTextMessage?.text) return 'mensaje'

  return 'contenido'
}

function formatDeletionTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export function rememberMessage(msg) {
  if (!msg?.key?.id || !msg?.message) return
  if (msg.key.fromMe) return
  if (msg.key.remoteJid === 'status@broadcast') return
  if (msg.message.protocolMessage) return

  cleanupCache()

  const entry = {
    msg,
    text: getTextMessage(msg),
    sender: msg.key.participant || msg.key.remoteJid,
    createdAt: Date.now(),
    type: describeMessage(msg)
  }

  for (const cacheKey of getMessageKeys(msg.key)) {
    messageCache.set(cacheKey, entry)
  }
}

export async function handleDeletedMessage({ sock, msg, db }) {
  const protocol = msg?.message?.protocolMessage
  if (!protocol?.key) return

  const remoteJid = msg.key?.remoteJid || protocol.key.remoteJid
  if (!remoteJid?.endsWith('@g.us')) return

  const group = ensureGroup(db, remoteJid)
  if (!group.antidelete) return

  const candidateKeys = getMessageKeys({
    remoteJid,
    participant: protocol.key.participant || protocol.key.remoteJid,
    id: protocol.key.id
  })

  const cached = candidateKeys
    .map(key => messageCache.get(key))
    .find(Boolean)

  if (!cached) return

  const sender = cached.sender
  const name = `@${getNumberFromJid(sender)}`
  const textPreview = cached.text?.trim()
  const deletedAt = formatDeletionTime()

  await sock.sendMessage(remoteJid, {
    text:
      `🛰️ *ANTIDELETE ASTRAL ACTIVADO*\n\n` +
      `${name} intento borrar un ${cached.type} de la orbita.\n` +
      `🕒 Hora detectada: ${deletedAt}\n` +
      `${textPreview ? `📝 Registro capturado: ${textPreview}` : '📝 AstraBot logro rescatar la señal original.'}`,
    mentions: [sender]
  }, { quoted: msg })

  try {
    await sock.copyNForward(remoteJid, cached.msg, false, {
      quoted: msg
    })
  } catch (error) {
    console.error('Error antidelete forward:', error)
  }
}
