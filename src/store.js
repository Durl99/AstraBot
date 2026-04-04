import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve('src/database.json')

const defaultDb = {
  bot: {
    public: true
  },
  groups: {},
  antiFlood: {},
  warnings: {},
  bans: {},
  afk: {},
  users: {},
  marriages: {},
  proposals: {}
}

export function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2))
    return structuredClone(defaultDb)
  }

  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

    if (!data.bot) data.bot = { public: true }
    if (typeof data.bot.public !== 'boolean') data.bot.public = true
    if (!data.groups) data.groups = {}
    if (!data.antiFlood) data.antiFlood = {}
    if (!data.warnings) data.warnings = {}
    if (!data.bans) data.bans = {}
    if (!data.afk) data.afk = {}
    if (!data.users) data.users = {}
    if (!data.marriages) data.marriages = {}
    if (!data.proposals) data.proposals = {}

    return data
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2))
    return structuredClone(defaultDb)
  }
}

export function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function ensureGroup(db, jid) {
  if (!db.groups[jid]) {
    db.groups[jid] = {
      antilink: false,
      welcome: false,
      welcomeText: '🌠 Bienvenido @user a la orbita de *@group*.',
      byeText: '🌙 @user abandono la orbita de *@group*.',
      muted: false,
      antiFlood: false
    }
  }

  if (typeof db.groups[jid].antilink !== 'boolean') db.groups[jid].antilink = false
  if (typeof db.groups[jid].welcome !== 'boolean') db.groups[jid].welcome = false
  if (typeof db.groups[jid].muted !== 'boolean') db.groups[jid].muted = false
  if (typeof db.groups[jid].antiFlood !== 'boolean') db.groups[jid].antiFlood = false
  if (!db.groups[jid].welcomeText) db.groups[jid].welcomeText = '🌠 Bienvenido @user a la orbita de *@group*.'
  if (!db.groups[jid].byeText) db.groups[jid].byeText = '🌙 @user abandono la orbita de *@group*.'

  return db.groups[jid]
}

export function ensureWarnings(db, groupId, userId) {
  if (!db.warnings[groupId]) db.warnings[groupId] = {}
  if (!db.warnings[groupId][userId]) db.warnings[groupId][userId] = 0
  return db.warnings[groupId][userId]
}

export function ensureBanGroup(db, groupId) {
  if (!db.bans[groupId]) db.bans[groupId] = {}
  return db.bans[groupId]
}

export function ensureUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      registered: false,
      regName: '',
      regTime: 0,
      coins: 100,
      bank: 0,
      xp: 0,
      level: 1,
      lastDaily: 0,
      lastWork: 0,
      lastRob: 0,
      inventory: {}
    }
  }

  const user = db.users[userId]

  if (typeof user.registered !== 'boolean') user.registered = false
  if (typeof user.regName !== 'string') user.regName = ''
  if (typeof user.regTime !== 'number') user.regTime = 0
  if (typeof user.coins !== 'number') user.coins = 100
  if (typeof user.bank !== 'number') user.bank = 0
  if (typeof user.xp !== 'number') user.xp = 0
  if (typeof user.level !== 'number') user.level = 1
  if (typeof user.lastDaily !== 'number') user.lastDaily = 0
  if (typeof user.lastWork !== 'number') user.lastWork = 0
  if (typeof user.lastRob !== 'number') user.lastRob = 0
  if (!user.inventory || typeof user.inventory !== 'object') user.inventory = {}

  return user
}
