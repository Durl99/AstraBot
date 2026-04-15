import { getInventoryAmount, removeItem } from './economy.js'

const PET_SPECIES = {
  nebby: {
    key: 'nebby',
    emoji: '\u{1F431}',
    kind: 'Gatito Nebular',
    description: 'Curioso, elegante y bueno para encontrar brillo en la orbita.'
  },
  comet: {
    key: 'comet',
    emoji: '\u{1F43A}',
    kind: 'Zorro Cometa',
    description: 'Rapido y jugueton, siempre empuja un poco mas tus ganancias.'
  },
  luna: {
    key: 'luna',
    emoji: '\u{1F430}',
    kind: 'Conejo Lunar',
    description: 'Dulce y estable, mantiene alta la armonia astral.'
  },
  draco: {
    key: 'draco',
    emoji: '\u{1F409}',
    kind: 'Dragon Estelar',
    description: 'Pequeno, feroz y perfecto para raids cosmicos.'
  }
}

const HUNGER_DECAY_PER_HOUR = 5
const MOOD_DECAY_PER_HOUR = 4
const MAX_STAT = 100

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function listPetSpecies() {
  return Object.values(PET_SPECIES)
}

export function getPetSpecies(key = '') {
  return PET_SPECIES[String(key).toLowerCase()] || null
}

export function syncPetState(user, now = Date.now()) {
  if (!user.pet) return null

  const pet = user.pet
  const lastSync = Number(pet.lastSync || pet.adoptedAt || now)
  const elapsedHours = Math.floor(Math.max(0, now - lastSync) / (60 * 60 * 1000))

  if (elapsedHours > 0) {
    pet.hunger = clamp(Number(pet.hunger || MAX_STAT) - elapsedHours * HUNGER_DECAY_PER_HOUR, 0, MAX_STAT)
    pet.mood = clamp(Number(pet.mood || MAX_STAT) - elapsedHours * MOOD_DECAY_PER_HOUR, 0, MAX_STAT)
  }

  pet.level = Math.max(1, Number(pet.level || 1))
  pet.xp = Math.max(0, Number(pet.xp || 0))
  pet.adoptedAt = Number(pet.adoptedAt || now)
  pet.lastFed = Number(pet.lastFed || 0)
  pet.lastPlay = Number(pet.lastPlay || 0)
  pet.lastSync = now

  return pet
}

export function adoptPet(user, speciesKey, customName = '') {
  if (user.pet) {
    return { error: 'Ya tienes un companion astral activo. Usa *.pet* para ver su estado.' }
  }

  const species = getPetSpecies(speciesKey)
  if (!species) {
    return { error: 'Esa especie no existe en la constelacion de companions.' }
  }

  const now = Date.now()
  user.pet = {
    species: species.key,
    name: (customName || species.kind).trim().slice(0, 24),
    level: 1,
    xp: 0,
    hunger: 85,
    mood: 90,
    adoptedAt: now,
    lastFed: 0,
    lastPlay: 0,
    lastSync: now
  }

  return { pet: user.pet, species }
}

function levelPet(pet) {
  let leveled = 0
  while (pet.xp >= pet.level * 80) {
    pet.xp -= pet.level * 80
    pet.level += 1
    leveled++
  }
  return leveled
}

export function feedPet(user, itemKey = 'petfood') {
  const pet = syncPetState(user)
  if (!pet) {
    return { error: 'Primero adopta un companion con *.pet adoptar especie nombre*.' }
  }

  const normalized = String(itemKey || 'petfood').toLowerCase()
  const amount = getInventoryAmount(user, normalized)
  if (amount < 1) {
    const name = normalized === 'apple' ? 'apple' : 'petfood'
    return { error: `No tienes *${name}* en el inventario astral.` }
  }

  const food = normalized === 'apple'
    ? { itemKey: 'apple', hunger: 20, mood: 8, xp: 8, label: 'Manzana Cosmica' }
    : { itemKey: 'petfood', hunger: 38, mood: 18, xp: 16, label: 'Snack Estelar' }

  removeItem(user, food.itemKey, 1)
  pet.hunger = clamp(pet.hunger + food.hunger, 0, MAX_STAT)
  pet.mood = clamp(pet.mood + food.mood, 0, MAX_STAT)
  pet.xp += food.xp
  pet.lastFed = Date.now()
  const leveled = levelPet(pet)

  return {
    pet,
    leveled,
    label: food.label
  }
}

export function playWithPet(user) {
  const pet = syncPetState(user)
  if (!pet) {
    return { error: 'Primero adopta un companion con *.pet adoptar especie nombre*.' }
  }

  const now = Date.now()
  const cooldownMs = 45 * 60 * 1000
  const left = pet.lastPlay + cooldownMs - now
  if (left > 0) {
    return { error: 'Tu companion aun esta recuperando energia de su ultima orbita de juego.', left }
  }

  pet.mood = clamp(pet.mood + 26, 0, MAX_STAT)
  pet.hunger = clamp(pet.hunger - 8, 0, MAX_STAT)
  pet.xp += 14
  pet.lastPlay = now
  const leveled = levelPet(pet)

  return { pet, leveled }
}

export function renamePet(user, newName) {
  const pet = syncPetState(user)
  if (!pet) {
    return { error: 'No tienes un companion astral para renombrar.' }
  }

  const name = String(newName || '').trim().slice(0, 24)
  if (!name) {
    return { error: 'Dame un nombre astral valido para tu companion.' }
  }

  pet.name = name
  return { pet }
}

export function getPetMoodLabel(pet) {
  if (pet.mood >= 85 && pet.hunger >= 70) return 'Radiante'
  if (pet.mood >= 65 && pet.hunger >= 50) return 'Estable'
  if (pet.mood >= 40 && pet.hunger >= 30) return 'Inquieto'
  return 'Debilitado'
}

export function getPetPassives(user) {
  const pet = syncPetState(user)
  if (!pet) {
    return {
      active: false,
      economyMultiplier: 0,
      bossBonus: 0,
      status: 'Sin companion'
    }
  }

  const wellness = (pet.hunger + pet.mood) / 2
  const active = pet.hunger >= 25 && pet.mood >= 25
  const economyMultiplier = active ? clamp(0.03 + pet.level * 0.01 + wellness / 1000, 0, 0.18) : 0
  const bossBonus = active ? Math.max(4, Math.floor(pet.level * 4 + wellness / 12)) : 0

  return {
    active,
    pet,
    economyMultiplier,
    bossBonus,
    status: getPetMoodLabel(pet)
  }
}

export function formatPetStatus(pet) {
  return [
    `Nombre: *${pet.name}*`,
    `Nivel: *${pet.level}*`,
    `XP: *${pet.xp}*`,
    `Hambre: *${pet.hunger}/${MAX_STAT}*`,
    `Animo: *${pet.mood}/${MAX_STAT}*`,
    `Estado: *${getPetMoodLabel(pet)}*`
  ].join('\n')
}
