import { ensureUser, saveDB } from '../store.js'
import { feedPet, getPetSpecies } from '../pets.js'

const WARN = '\u26A0\uFE0F'

export default {
  name: 'feedpet',
  aliases: ['alimentarpet', 'petfeed'],
  description: 'Alimenta a tu companion astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, msg, db }) {
    const user = ensureUser(db, sender)
    const itemKey = (args[0] || 'petfood').toLowerCase()
    const result = feedPet(user, itemKey)

    if (result.error) {
      return sock.sendMessage(from, {
        text: `${WARN} ${result.error}\n\nPrueba *.buy petfood 2* o usa *.feedpet apple*.`
      }, { quoted: msg })
    }

    saveDB(db)
    const species = getPetSpecies(result.pet.species)
    const levelLine = result.leveled > 0
      ? `\n\n\u{1F31F} ${result.pet.name} subio a *nivel ${result.pet.level}*.`
      : ''

    await sock.sendMessage(from, {
      text:
        `${species?.emoji || '\u{1F43E}'} *COMPANION ALIMENTADO*\n\n` +
        `Tu companion disfruto *${result.label}*.\n` +
        `Hambre: *${result.pet.hunger}/100*\n` +
        `Animo: *${result.pet.mood}/100*` +
        levelLine
    }, { quoted: msg })
  }
}
