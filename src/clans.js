import { ensureUser, saveDB } from './store.js'

function randomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function ensureClanContainer(db) {
  if (!db.clans || typeof db.clans !== 'object') db.clans = {}
  return db.clans
}

export function getClan(db, clanId) {
  return ensureClanContainer(db)[clanId] || null
}

export function getClanByCode(db, code = '') {
  const normalized = String(code || '').trim().toUpperCase()
  return Object.values(ensureClanContainer(db)).find(clan => clan.code === normalized) || null
}

export function createClan(db, sender, name) {
  const user = ensureUser(db, sender)
  if (user.clanId) {
    return { error: 'Ya formas parte de un clan astral.' }
  }

  const clans = ensureClanContainer(db)
  const cleanName = String(name || '').trim().slice(0, 30)
  if (cleanName.length < 3) {
    return { error: 'El nombre del clan debe tener al menos 3 caracteres.' }
  }

  let code = randomCode()
  while (getClanByCode(db, code)) {
    code = randomCode()
  }

  const clanId = `clan_${code.toLowerCase()}`
  clans[clanId] = {
    id: clanId,
    code,
    name: cleanName,
    founder: sender,
    leader: sender,
    bank: 0,
    xp: 0,
    members: [sender],
    createdAt: Date.now()
  }

  user.clanId = clanId
  saveDB(db)
  return { clan: clans[clanId] }
}

export function joinClan(db, sender, code) {
  const user = ensureUser(db, sender)
  if (user.clanId) {
    return { error: 'Ya perteneces a un clan astral.' }
  }

  const clan = getClanByCode(db, code)
  if (!clan) {
    return { error: 'No encontre un clan con ese codigo orbital.' }
  }

  if (!clan.members.includes(sender)) {
    clan.members.push(sender)
  }

  user.clanId = clan.id
  saveDB(db)
  return { clan }
}

export function leaveClan(db, sender) {
  const user = ensureUser(db, sender)
  if (!user.clanId) {
    return { error: 'No perteneces a ningun clan astral.' }
  }

  const clan = getClan(db, user.clanId)
  if (!clan) {
    user.clanId = null
    saveDB(db)
    return { error: 'Tu clan ya no existe. Se limpio tu vinculo astral.' }
  }

  if (clan.leader === sender && clan.members.length > 1) {
    return { error: 'Transfiere o disuelve el clan antes de salir si aun hay mas miembros.' }
  }

  clan.members = clan.members.filter(member => member !== sender)
  user.clanId = null

  if (!clan.members.length) {
    delete db.clans[clan.id]
  } else if (clan.leader === sender) {
    clan.leader = clan.members[0]
  }

  saveDB(db)
  return { clan }
}

export function donateClan(db, sender, amount) {
  const user = ensureUser(db, sender)
  if (!user.clanId) {
    return { error: 'No perteneces a ningun clan astral.' }
  }

  const clan = getClan(db, user.clanId)
  if (!clan) {
    return { error: 'Tu clan no pudo ser localizado en la base astral.' }
  }

  if (!amount || amount < 1) {
    return { error: 'La donacion debe ser mayor que cero.' }
  }

  if (user.coins < amount) {
    return { error: 'No tienes suficientes coins para esa donacion.' }
  }

  user.coins -= amount
  clan.bank += amount
  clan.xp += Math.max(5, Math.floor(amount / 10))
  saveDB(db)
  return { clan, amount }
}

export function getClanTop(db) {
  return Object.values(ensureClanContainer(db))
    .map(clan => ({
      ...clan,
      power: clan.bank + clan.xp + clan.members.length * 120
    }))
    .sort((a, b) => b.power - a.power)
}

export function transferClanLeadership(db, sender, targetJid) {
  const user = ensureUser(db, sender)
  if (!user.clanId) {
    return { error: 'No perteneces a ningun clan astral.' }
  }

  const clan = getClan(db, user.clanId)
  if (!clan) {
    return { error: 'Tu clan no pudo ser localizado en la base astral.' }
  }

  if (clan.leader !== sender) {
    return { error: 'Solo el lider puede transferir el mando del clan.' }
  }

  if (!clan.members.includes(targetJid)) {
    return { error: 'Ese objetivo no forma parte de tu clan.' }
  }

  clan.leader = targetJid
  saveDB(db)
  return { clan }
}

export function disbandClan(db, sender) {
  const user = ensureUser(db, sender)
  if (!user.clanId) {
    return { error: 'No perteneces a ningun clan astral.' }
  }

  const clan = getClan(db, user.clanId)
  if (!clan) {
    user.clanId = null
    saveDB(db)
    return { error: 'Tu clan ya no existia. Se limpio tu vinculo astral.' }
  }

  if (clan.leader !== sender) {
    return { error: 'Solo el lider puede disolver el clan.' }
  }

  for (const member of clan.members) {
    const target = ensureUser(db, member)
    target.clanId = null
  }

  delete db.clans[clan.id]
  saveDB(db)
  return { clan }
}
