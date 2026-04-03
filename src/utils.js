import sharp from 'sharp'
import webp from 'node-webpmux'

export function getTextMessage(msg) {
  const m = msg.message
  if (!m) return ''

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.ephemeralMessage?.message?.conversation ||
    m.ephemeralMessage?.message?.extendedTextMessage?.text ||
    m.ephemeralMessage?.message?.imageMessage?.caption ||
    m.ephemeralMessage?.message?.videoMessage?.caption ||
    ''
  )
}

export function isGroup(jid = '') {
  return jid.endsWith('@g.us')
}

export function getSenderJid(msg) {
  return msg.key.participant || msg.key.remoteJid
}

export function getNumberFromJid(jid = '') {
  return jid.split('@')[0]
}

export function normalizeOwnerNumbers(ownerList = []) {
  return ownerList.map(v => String(v).replace(/[^0-9]/g, ''))
}

export function normalizeOwnerLids(lidList = []) {
  return lidList.map(v => String(v).replace(/[^0-9]/g, ''))
}

function jidUserPart(jid = '') {
  return String(jid).split('@')[0].split(':')[0]
}

export function extractSenderCandidates(msg) {
  const candidates = new Set()

  const add = (value) => {
    if (!value) return
    const cleaned = String(value).replace(/[^0-9]/g, '')
    if (cleaned) candidates.add(cleaned)
  }

  add(msg?.key?.participant)
  add(msg?.key?.remoteJid)

  add(msg?.participant)
  add(msg?.participantPn)
  add(msg?.senderPn)

  const m = msg?.message || {}
  add(m?.senderPn)
  add(m?.participantPn)
  add(m?.messageContextInfo?.senderPn)
  add(m?.messageContextInfo?.participantPn)

  add(m?.extendedTextMessage?.contextInfo?.participant)
  add(m?.extendedTextMessage?.contextInfo?.participantPn)
  add(m?.extendedTextMessage?.contextInfo?.senderPn)

  add(m?.imageMessage?.contextInfo?.participant)
  add(m?.imageMessage?.contextInfo?.participantPn)
  add(m?.imageMessage?.contextInfo?.senderPn)

  add(m?.videoMessage?.contextInfo?.participant)
  add(m?.videoMessage?.contextInfo?.participantPn)
  add(m?.videoMessage?.contextInfo?.senderPn)

  add(m?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant)
  add(m?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participantPn)
  add(m?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.senderPn)

  return [...candidates]
}

export async function isAdmin(sock, groupJid, userJid) {
  const metadata = await sock.groupMetadata(groupJid)
  const targetUser = jidUserPart(userJid)

  const participant = metadata.participants.find(p => {
    const pid = jidUserPart(p.id || p.jid || p.lid || '')
    return pid === targetUser
  })

  return participant?.admin === 'admin' || participant?.admin === 'superadmin'
}

export async function isBotAdmin(sock, groupJid) {
  const metadata = await sock.groupMetadata(groupJid)

  const myIds = [
    sock.user?.id,
    sock.user?.lid,
    sock.user?.jid
  ]
    .filter(Boolean)
    .map(jidUserPart)

  const participant = metadata.participants.find(p => {
    const pid = jidUserPart(p.id || p.jid || p.lid || '')
    return myIds.includes(pid)
  })

  return participant?.admin === 'admin' || participant?.admin === 'superadmin'
}

export function getContextInfo(msg) {
  const m = msg.message || {}

  return (
    m.extendedTextMessage?.contextInfo ||
    m.imageMessage?.contextInfo ||
    m.videoMessage?.contextInfo ||
    m.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
    m.ephemeralMessage?.message?.imageMessage?.contextInfo ||
    m.ephemeralMessage?.message?.videoMessage?.contextInfo ||
    {}
  )
}

export function getQuotedParticipant(msg) {
  const ctx = getContextInfo(msg)
  return ctx.participant || null
}

export function getMentionedJids(msg) {
  const ctx = getContextInfo(msg)
  return ctx.mentionedJid || []
}

export function getTargetUser(msg) {
  const mentioned = getMentionedJids(msg)
  if (mentioned.length) return mentioned[0]

  const quoted = getQuotedParticipant(msg)
  if (quoted) return quoted

  return null
}

export async function imageToWebp(buffer) {
  return await sharp(buffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90 })
    .toBuffer()
}

export async function imageToWebpWithExif(buffer, packname = 'AstraBot', author = 'Astra Core') {
  const webpBuffer = await imageToWebp(buffer)

  const img = new webp.Image()
  await img.load(webpBuffer)

  const json = {
    'sticker-pack-id': 'com.astrabot.sticker',
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis: ['🌌']
  }

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00,
    0x00, 0x00
  ])

  const exif = Buffer.concat([exifAttr, jsonBuffer])

  exif.writeUIntLE(jsonBuffer.length, 14, 4)

  img.exif = exif

  const finalBuffer = await img.save(null)
  return finalBuffer
}