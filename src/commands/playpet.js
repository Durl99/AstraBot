import { ensureUser, saveDB } from '../store.js'
import { getPetSpecies, playWithPet } from '../pets.js'

const WARN = '\u26A0\uFE0F'

function formatTime(ms) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  const parts = []
  if (m) parts.push(`${m}m`)
  if (sec || !parts.length) parts.push(`${sec}s`)
  return parts.join(' ')
}

export default {
  name: 'playpet',
  aliases: ['jugarpet', 'petplay'],
  description: 'Juega con tu companion para elevar su animo',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const user = ensureUser(db, sender)
    const result = playWithPet(user)

    if (result.error) {
      const leftLine = result.left ? `\nRecarga restante: *${formatTime(result.left)}*` : ''
      return sock.sendMessage(from, {
        text: `${WARN} ${result.error}${leftLine}`
      }, { quoted: msg })
    }

    saveDB(db)
    const species = getPetSpecies(result.pet.species)
    const levelLine = result.leveled > 0
      ? `\n\n\u{1F31F} ${result.pet.name} subio a *nivel ${result.pet.level}*.`
      : ''

    await sock.sendMessage(from, {
      text:
        `${species?.emoji || '\u{1F43E}'} *JUEGO ORBITAL COMPLETADO*\n\n` +
        `${result.pet.name} giro feliz entre las estrellas.\n` +
        `Animo: *${result.pet.mood}/100*\n` +
        `Hambre: *${result.pet.hunger}/100*` +
        levelLine
    }, { quoted: msg })
  }
}
