const ACHIEVEMENTS = [
  { id: 'first_daily', title: 'Primer Pulso', description: 'Reclama tu primer daily.', reward: 120, check: user => user.stats.dailyClaims >= 1 },
  { id: 'worker_10', title: 'Motor Nebular', description: 'Trabaja 10 veces.', reward: 250, check: user => user.stats.workCount >= 10 },
  { id: 'wealth_1000', title: 'Orbita de Bronce', description: 'Alcanza 1000 coins totales.', reward: 200, check: user => getTotalWealth(user) >= 1000 },
  { id: 'wealth_5000', title: 'Orbita Dorada', description: 'Alcanza 5000 coins totales.', reward: 700, check: user => getTotalWealth(user) >= 5000 },
  { id: 'duelist_5', title: 'Duellista Estelar', description: 'Gana 5 duelos.', reward: 300, check: user => user.stats.duelWins >= 5 },
  { id: 'collector_10', title: 'Coleccionista Cosmico', description: 'Compra 10 items.', reward: 280, check: user => user.stats.itemsBought >= 10 }
]

const DAILY_MISSION_TEMPLATES = [
  { id: 'claim_daily', title: 'Pulso Diario', description: 'Reclama tu daily 1 vez.', target: 1, reward: 180 },
  { id: 'work_twice', title: 'Turno Estelar', description: 'Trabaja 2 veces.', target: 2, reward: 240 },
  { id: 'economy_actions', title: 'Orbita Activa', description: 'Haz 3 acciones economicas.', target: 3, reward: 260 }
]

const RANKS = [
  { minLevel: 1, minWealth: 0, emoji: '✨', name: 'Polvo Estelar' },
  { minLevel: 3, minWealth: 600, emoji: '🌙', name: 'Luna Errante' },
  { minLevel: 5, minWealth: 1500, emoji: '🪐', name: 'Piloto Planetario' },
  { minLevel: 8, minWealth: 3500, emoji: '🌌', name: 'Guardian Nebular' },
  { minLevel: 12, minWealth: 7000, emoji: '🌟', name: 'Comandante Astral' },
  { minLevel: 18, minWealth: 15000, emoji: '👑', name: 'Soberano Cosmico' }
]

function getTodayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function ensureProgressionState(user) {
  if (!user.stats || typeof user.stats !== 'object') {
    user.stats = {}
  }

  const statsDefaults = {
    dailyClaims: 0,
    workCount: 0,
    robAttempts: 0,
    robWins: 0,
    duelWins: 0,
    itemsBought: 0,
    itemsUsed: 0,
    economyActions: 0,
    chestsOpened: 0
  }

  for (const [key, value] of Object.entries(statsDefaults)) {
    if (typeof user.stats[key] !== 'number') user.stats[key] = value
  }

  if (typeof user.lastChest !== 'number') user.lastChest = 0
  if (!user.achievements || typeof user.achievements !== 'object') user.achievements = {}
  if (!user.missions || typeof user.missions !== 'object') user.missions = {}
  return user
}

export function getTotalWealth(user) {
  return Number(user.coins || 0) + Number(user.bank || 0)
}

export function getAstralRank(user) {
  const wealth = getTotalWealth(user)
  let current = RANKS[0]

  for (const rank of RANKS) {
    if ((user.level || 1) >= rank.minLevel && wealth >= rank.minWealth) {
      current = rank
    }
  }

  return current
}

export function syncDailyMissions(user) {
  ensureProgressionState(user)
  const todayKey = getTodayKey()

  if (user.missions.dayKey === todayKey && Array.isArray(user.missions.list)) {
    return user.missions.list
  }

  user.missions.dayKey = todayKey
  user.missions.list = DAILY_MISSION_TEMPLATES.map(template => ({
    ...template,
    progress: 0,
    claimed: false
  }))

  return user.missions.list
}

function advanceMission(user, missionId, amount = 1) {
  const missions = syncDailyMissions(user)
  const mission = missions.find(entry => entry.id === missionId)
  if (!mission || mission.claimed) return
  mission.progress = Math.min(mission.target, mission.progress + amount)
}

export function recordProgressAction(user, action, meta = {}) {
  ensureProgressionState(user)
  const unlocked = []

  switch (action) {
    case 'daily':
      user.stats.dailyClaims += 1
      user.stats.economyActions += 1
      advanceMission(user, 'claim_daily', 1)
      advanceMission(user, 'economy_actions', 1)
      break
    case 'work':
      user.stats.workCount += 1
      user.stats.economyActions += 1
      advanceMission(user, 'work_twice', 1)
      advanceMission(user, 'economy_actions', 1)
      break
    case 'rob':
      user.stats.robAttempts += 1
      user.stats.economyActions += 1
      if (meta.success) user.stats.robWins += 1
      advanceMission(user, 'economy_actions', 1)
      break
    case 'duel_win':
      user.stats.duelWins += 1
      user.stats.economyActions += 1
      advanceMission(user, 'economy_actions', 1)
      break
    case 'buy':
      user.stats.itemsBought += Number(meta.qty || 1)
      user.stats.economyActions += 1
      advanceMission(user, 'economy_actions', 1)
      break
    case 'use':
      user.stats.itemsUsed += Number(meta.qty || 1)
      user.stats.economyActions += 1
      advanceMission(user, 'economy_actions', 1)
      break
    case 'chest':
      user.stats.chestsOpened += 1
      user.stats.economyActions += 1
      advanceMission(user, 'economy_actions', 1)
      break
    default:
      break
  }

  for (const achievement of ACHIEVEMENTS) {
    if (user.achievements[achievement.id]) continue
    if (!achievement.check(user)) continue

    user.achievements[achievement.id] = true
    user.coins += achievement.reward
    unlocked.push(achievement)
  }

  return unlocked
}

export function claimMission(user, index) {
  const missions = syncDailyMissions(user)
  const mission = missions[index]

  if (!mission) {
    return { error: 'Mision no encontrada.' }
  }

  if (mission.claimed) {
    return { error: 'Esa mision ya fue reclamada hoy.' }
  }

  if (mission.progress < mission.target) {
    return { error: 'Esa mision aun no esta completada.' }
  }

  mission.claimed = true
  user.coins += mission.reward
  return { mission }
}

export function getAchievementEntries(user) {
  ensureProgressionState(user)
  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: Boolean(user.achievements[achievement.id])
  }))
}

export function openAstralChest(user) {
  ensureProgressionState(user)
  const cooldownMs = 6 * 60 * 60 * 1000
  const now = Date.now()
  const left = user.lastChest + cooldownMs - now

  if (left > 0) {
    return { left }
  }

  const rewards = [
    { type: 'coins', amount: Math.floor(Math.random() * 181) + 120, text: amount => `🪙 El cofre libero *${amount}* coins de polvo estelar.` },
    { type: 'coins', amount: Math.floor(Math.random() * 321) + 180, text: amount => `🌠 Hallaste un pulso galactico con *${amount}* coins.` },
    { type: 'item', itemKey: 'crate', qty: 1, text: () => '📦 El cofre te entrego una *Caja Galactica*.' },
    { type: 'item', itemKey: 'potion', qty: 1, text: () => '🧪 El cofre destello y dejo caer una *Pocion Astral*.' }
  ]

  const reward = rewards[Math.floor(Math.random() * rewards.length)]
  user.lastChest = now
  return { reward, cooldownMs }
}
