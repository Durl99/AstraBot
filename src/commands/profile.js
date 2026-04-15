import { ensureUser, saveDB } from '../store.js'
import { getTargetUser } from '../utils.js'
import { getAchievementEntries, getAstralRank, getTotalWealth, syncDailyMissions } from '../progression.js'
import { getPetPassives, getPetSpecies } from '../pets.js'

const GALAXY = '\u{1F30C}'
const STAR = '\u{1F320}'
const MEDAL = '\u{1F396}\uFE0F'
const SPARKLES = '\u2728'
const MONEY = '\u{1F4B8}'
const BANK = '\u{1F3E6}'
const BUBBLE = '\u{1FAE7}'
const TROPHY = '\u{1F3C6}'
const SATELLITE = '\u{1F6F0}\uFE0F'
const PAW = '\u{1F43E}'
const HEARTS = '\u{1F49E}'
const ANTENNA = '\u{1F4E1}'

export default {
  name: 'profile',
  aliases: ['me', 'perfil'],
  description: 'Muestra el perfil astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg) || sender
    const user = ensureUser(db, target)

    const partnerJid = db.marriages?.[target] || null
    const proposal = db.proposals?.[target] || null
    const partner = partnerJid ? `@${partnerJid.split('@')[0]}` : 'Ninguna'
    const rank = getAstralRank(user)
    const unlockedAchievements = getAchievementEntries(user).filter(entry => entry.unlocked).length
    const missions = syncDailyMissions(user)
    const petPassive = getPetPassives(user)
    const petSpecies = petPassive.pet ? getPetSpecies(petPassive.pet.species) : null

    let proposalText = 'Ninguna'
    if (proposal) {
      if (Date.now() > proposal.expiresAt) {
        delete db.proposals[target]
        saveDB(db)
      } else {
        proposalText = `De @${proposal.from.split('@')[0]}`
      }
    }

    const mentions = [target]
    if (partnerJid) mentions.push(partnerJid)
    if (proposal && Date.now() <= proposal.expiresAt) mentions.push(proposal.from)

    await sock.sendMessage(from, {
      text:
        `${GALAXY} *PERFIL ASTRAL DE @${target.split('@')[0]}*\n\n` +
        `${STAR} Rango: ${rank.emoji} *${rank.name}*\n` +
        `${MEDAL} Nivel: *${user.level}*\n` +
        `${SPARKLES} XP: *${user.xp}*\n` +
        `${MONEY} Coins: *${user.coins}*\n` +
        `${BANK} Banco: *${user.bank}*\n` +
        `${BUBBLE} Total orbital: *${getTotalWealth(user)}*\n` +
        `${TROPHY} Logros: *${unlockedAchievements}*\n` +
        `${SATELLITE} Misiones de hoy: *${missions.filter(m => m.claimed).length}/${missions.length}* reclamadas\n` +
        `${PAW} Companion: *${petPassive.pet ? `${petSpecies?.emoji || ''} ${petPassive.pet.name} Lv.${petPassive.pet.level}` : 'Ninguno'}*\n` +
        `${HEARTS} Pareja: *${partner}*\n` +
        `${ANTENNA} Propuesta: *${proposalText}*`,
      mentions
    })
  }
}
