import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve('src/database.json')
const DEFAULT_WELCOME_TEXT = '🌠 *BIENVENIDO A LA ORBITA DE ASTRA BOT* 🌠\n\n@user, tu señal fue detectada en *@group*.\n✨ Ajusta tus estrellas, respira cosmos y disfruta la travesia.'
const DEFAULT_BYE_TEXT = '🌙 *SALIDA DE LA ORBITA ASTRAL* 🌙\n\n@user se despidio de *@group*.\n✨ AstraBot registra su estela entre las estrellas.'

const defaultDb = {
  bot: {
    public: true
  },
  groups: {},
  clans: {},
  market: {
    nextId: 1,
    listings: []
  },
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
    if (!data.clans) data.clans = {}
    if (!data.market || typeof data.market !== 'object') data.market = { nextId: 1, listings: [] }
    if (typeof data.market.nextId !== 'number') data.market.nextId = 1
    if (!Array.isArray(data.market.listings)) data.market.listings = []
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
      antilinkMode: 'kick',
      antidelete: false,
      welcome: false,
      welcomeText: DEFAULT_WELCOME_TEXT,
      bye: false,
      byeText: DEFAULT_BYE_TEXT,
      boss: null,
      muted: false,
      antiFlood: false
    }
  }

  if (typeof db.groups[jid].antilink !== 'boolean') db.groups[jid].antilink = false
  if (!['kick', 'warn'].includes(db.groups[jid].antilinkMode)) db.groups[jid].antilinkMode = 'kick'
  if (typeof db.groups[jid].antidelete !== 'boolean') db.groups[jid].antidelete = false
  if (typeof db.groups[jid].welcome !== 'boolean') db.groups[jid].welcome = false
  if (typeof db.groups[jid].bye !== 'boolean') db.groups[jid].bye = false
  if (!('boss' in db.groups[jid])) db.groups[jid].boss = null
  if (typeof db.groups[jid].muted !== 'boolean') db.groups[jid].muted = false
  if (typeof db.groups[jid].antiFlood !== 'boolean') db.groups[jid].antiFlood = false
  if (!db.groups[jid].welcomeText) db.groups[jid].welcomeText = DEFAULT_WELCOME_TEXT
  if (!db.groups[jid].byeText) db.groups[jid].byeText = DEFAULT_BYE_TEXT

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
      lastChest: 0,
      lastEvent: 0,
      achievements: {},
      missions: {},
      stats: {},
      clanId: null,
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
  if (typeof user.lastChest !== 'number') user.lastChest = 0
  if (typeof user.lastEvent !== 'number') user.lastEvent = 0
  if (!user.achievements || typeof user.achievements !== 'object') user.achievements = {}
  if (!user.missions || typeof user.missions !== 'object') user.missions = {}
  if (!user.stats || typeof user.stats !== 'object') user.stats = {}
  if (typeof user.clanId !== 'string' && user.clanId !== null) user.clanId = null
  if (!user.inventory || typeof user.inventory !== 'object') user.inventory = {}

  return user
}
