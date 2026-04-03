import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { config } from './config.js'
import { AstraText } from './astramessages.js'
import {
  getTextMessage,
  getSenderJid,
  normalizeOwnerNumbers,
  normalizeOwnerLids,
  extractSenderCandidates,
  isGroup,
  isAdmin,
  getMentionedJids,
  getQuotedParticipant
} from './utils.js'
import { ensureGroup, ensureBanGroup, ensureUser, saveDB } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cooldowns = new Map()

function getCooldownKey(sender, commandName) {
  return `${sender}:${commandName}`
}

function isOnCooldown(sender, commandName, seconds = 0) {
  if (!seconds) return 0

  const key = getCooldownKey(sender, commandName)
  const now = Date.now()
  const expires = cooldowns.get(key) || 0

  if (expires > now) {
    return Math.ceil((expires - now) / 1000)
  }

  cooldowns.set(key, now + seconds * 1000)
  return 0
}

function getFloodEntry(db, groupId, userId) {
  if (!db.antiFlood[groupId]) db.antiFlood[groupId] = {}
  if (!db.antiFlood[groupId][userId]) {
    db.antiFlood[groupId][userId] = {
      timestamps: [],
      lastWarn: 0
    }
  }
  return db.antiFlood[groupId][userId]
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (s || !parts.length) parts.push(`${s}s`)
  return parts.join(' ')
}

function addXp(db, sender, amount = 5) {
  const user = ensureUser(db, sender)
  user.xp += amount

  let leveledUp = false
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100
    user.level += 1
    user.coins += 50
    leveledUp = true
  }

  return { user, leveledUp }
}

export async function loadCommands() {
  const commandsDir = path.join(__dirname, 'commands')
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))
  const commands = []

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(commandsDir, file)).href)
    commands.push(mod.default)
  }

  return commands
}

export async function handleMessage({ sock, msg, commands, db }) {
  const from = msg.key.remoteJid
  const sender = getSenderJid(msg)
  const body = getTextMessage(msg)

  const ownerNumbers = normalizeOwnerNumbers(config.owner)
  const ownerLids = normalizeOwnerLids(config.ownerLid || [])
  const senderCandidates = extractSenderCandidates(msg)

  const userIsOwner = senderCandidates.some(candidate =>
    ownerNumbers.includes(candidate) || ownerLids.includes(candidate)
  )

  const chatIsGroup = isGroup(from)
  const userIsAdmin = chatIsGroup ? await isAdmin(sock, from, sender) : false
  const senderUser = ensureUser(db, sender)

  if (body && !body.startsWith(config.prefix) && (senderUser.registered || userIsOwner)) {
    addXp(db, sender, 4)
    saveDB(db)
  }

  if (db.afk?.[sender] && body) {
    const afkData = db.afk[sender]
    delete db.afk[sender]
    saveDB(db)

    const duration = formatDuration(Date.now() - afkData.since)
    await sock.sendMessage(from, {
      text: AstraText.afkRemoved(duration)
    }, { quoted: msg })
  }

  if (chatIsGroup && body) {
    const targets = new Set([
      ...getMentionedJids(msg),
      ...(getQuotedParticipant(msg) ? [getQuotedParticipant(msg)] : [])
    ])

    for (const jid of targets) {
      const afkData = db.afk?.[jid]
      if (!afkData) continue

      const duration = formatDuration(Date.now() - afkData.since)
      const name = `@${String(jid).split('@')[0]}`

      await sock.sendMessage(from, {
        text: AstraText.userAfk(name, afkData.reason, duration),
        mentions: [jid]
      }, { quoted: msg })
    }
  }

  if (chatIsGroup) {
    const banGroup = ensureBanGroup(db, from)
    if (banGroup[sender] && !userIsOwner && !userIsAdmin && body.startsWith(config.prefix)) {
      return sock.sendMessage(from, { text: AstraText.bannedBlocked })
    }
  }

  if (chatIsGroup) {
    const group = ensureGroup(db, from)

    if (group.antiFlood && !userIsOwner && !userIsAdmin && body) {
      const entry = getFloodEntry(db, from, sender)
      const now = Date.now()

      entry.timestamps = entry.timestamps.filter(t => now - t < 10000)
      entry.timestamps.push(now)

      if (entry.timestamps.length >= 6 && now - entry.lastWarn > 15000) {
        entry.lastWarn = now
        saveDB(db)
        await sock.sendMessage(from, { text: AstraText.floodWarn })
      }

      if (entry.timestamps.length >= 9) {
        for (const cmd of commands) {
          if (cmd.name === 'antiflood' && typeof cmd.handleFlood === 'function') {
            try {
              await cmd.handleFlood({ sock, from, sender, db })
            } catch (e) {
              console.error('Error antiflood:', e)
            }
          }
        }
        return
      }

      saveDB(db)
    }

    if (group.muted && !userIsOwner && !userIsAdmin) {
      if (body.startsWith(config.prefix)) {
        return
      }
    }
  }

  for (const cmd of commands) {
    if (typeof cmd.onMessage === 'function') {
      try {
        await cmd.onMessage({ sock, msg, from, sender, db, isOwner: userIsOwner, isAdmin: userIsAdmin })
      } catch (e) {
        console.error(`onMessage error en ${cmd.name}:`, e)
      }
    }
  }

  if (!body.startsWith(config.prefix)) return
  if (!db.bot?.public && !userIsOwner) return

  if (chatIsGroup) {
    const group = ensureGroup(db, from)
    if (group.muted && !userIsOwner && !userIsAdmin) {
      return sock.sendMessage(from, { text: AstraText.muted })
    }
  }

  const args = body.slice(config.prefix.length).trim().split(/\s+/)
  const commandName = (args.shift() || '').toLowerCase()
  if (!commandName) return

  const command = commands.find(c => c.name === commandName || c.aliases?.includes(commandName))
  if (!command) return

  const noRegisterNeeded = ['register', 'unregister']
  if (!senderUser.registered && !userIsOwner && !noRegisterNeeded.includes(command.name)) {
    return sock.sendMessage(from, {
      text:
        '🌌 *ACCESO RESTRINGIDO*\n\n' +
        'Para usar AstraBot debes registrarte primero.\n' +
        'Usa: *.register TuNombre*'
    }, { quoted: msg })
  }

  if (command.ownerOnly && !userIsOwner) {
    return sock.sendMessage(from, { text: AstraText.ownerOnly })
  }

  if (command.groupOnly && !chatIsGroup) {
    return sock.sendMessage(from, { text: AstraText.groupOnly })
  }

  if (command.privateOnly && chatIsGroup) {
    return sock.sendMessage(from, { text: AstraText.privateOnly })
  }

  if (command.adminOnly && !userIsAdmin) {
    return sock.sendMessage(from, { text: AstraText.adminOnly })
  }

  const remaining = isOnCooldown(sender, command.name, command.cooldown || 0)
  if (remaining > 0) {
    return sock.sendMessage(from, { text: AstraText.cooldown(command.name, remaining) })
  }

  try {
    let xpResult = null
    if (senderUser.registered || userIsOwner) {
      xpResult = addXp(db, sender, 8)
      saveDB(db)
    }

    await command.run({
      sock,
      msg,
      from,
      sender,
      args,
      body,
      commands,
      config,
      db,
      isOwner: userIsOwner,
      isAdmin: userIsAdmin,
      isGroup: chatIsGroup
    })

    if (xpResult?.leveledUp) {
      await sock.sendMessage(from, {
        text: `🌠 Ascendiste de nivel. Ahora estás en *nivel ${xpResult.user.level}* y recibiste *50* coins astrales.`
      }, { quoted: msg })
    }
  } catch (error) {
    console.error(`Error en ${command.name}:`, error)
    await sock.sendMessage(from, { text: AstraText.error })
  }
}