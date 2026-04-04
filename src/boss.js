import { ensureGroup, ensureUser, saveDB } from './store.js'

const BOSSES = [
  { id: 'meteor-dragon', name: 'Dragon Meteoro', emoji: '🐉', minHp: 1800, maxHp: 2600, minAtk: 90, maxAtk: 180, rewardMin: 700, rewardMax: 1200 },
  { id: 'nebula-titan', name: 'Titan Nebular', emoji: '🗿', minHp: 2400, maxHp: 3400, minAtk: 120, maxAtk: 220, rewardMin: 1000, rewardMax: 1500 },
  { id: 'eclipse-queen', name: 'Reina del Eclipse', emoji: '👑', minHp: 3000, maxHp: 4200, minAtk: 130, maxAtk: 250, rewardMin: 1400, rewardMax: 1900 }
]

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getBoss(group) {
  return group?.boss || null
}

export function summonBoss(db, groupId) {
  const group = ensureGroup(db, groupId)
  if (group.boss && !group.boss.defeated) {
    return { error: 'Ya hay un boss activo en esta orbita.', boss: group.boss }
  }

  const template = BOSSES[Math.floor(Math.random() * BOSSES.length)]
  const maxHp = randomBetween(template.minHp, template.maxHp)

  group.boss = {
    id: template.id,
    name: template.name,
    emoji: template.emoji,
    maxHp,
    hp: maxHp,
    minAtk: template.minAtk,
    maxAtk: template.maxAtk,
    rewardMin: template.rewardMin,
    rewardMax: template.rewardMax,
    participants: {},
    startedAt: Date.now(),
    defeated: false
  }

  saveDB(db)
  return { boss: group.boss }
}

export function attackBoss(db, groupId, sender) {
  const group = ensureGroup(db, groupId)
  const boss = group.boss

  if (!boss || boss.defeated) {
    return { error: 'No hay un boss activo en esta orbita.' }
  }

  const user = ensureUser(db, sender)
  const now = Date.now()
  const participant = boss.participants[sender] || {
    damage: 0,
    lastAttack: 0
  }

  const cooldownMs = 45 * 1000
  const left = participant.lastAttack + cooldownMs - now
  if (left > 0) {
    return { error: 'Tu arsenal astral aun esta recargando.', left }
  }

  const damage = randomBetween(boss.minAtk, boss.maxAtk)
  boss.hp = Math.max(0, boss.hp - damage)
  participant.lastAttack = now
  participant.damage += damage
  boss.participants[sender] = participant

  const result = {
    boss,
    damage,
    defeated: boss.hp <= 0,
    participantDamage: participant.damage
  }

  if (result.defeated) {
    boss.defeated = true
    const totalReward = randomBetween(boss.rewardMin, boss.rewardMax)
    const entries = Object.entries(boss.participants).sort((a, b) => b[1].damage - a[1].damage)
    const totalDamage = entries.reduce((sum, [, data]) => sum + data.damage, 0) || 1

    result.rewards = entries.map(([jid, data], index) => {
      const contribution = data.damage / totalDamage
      const reward = Math.max(80, Math.floor(totalReward * contribution) + (index === 0 ? 180 : 0))
      const player = ensureUser(db, jid)
      player.coins += reward
      player.xp += Math.max(25, Math.floor(data.damage / 8))
      return {
        jid,
        damage: data.damage,
        reward
      }
    })
  }

  saveDB(db)
  return result
}

export function getBossTop(boss, limit = 5) {
  return Object.entries(boss?.participants || {})
    .map(([jid, data]) => ({ jid, damage: data.damage }))
    .sort((a, b) => b.damage - a.damage)
    .slice(0, limit)
}
