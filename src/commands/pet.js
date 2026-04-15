import { ensureUser, saveDB } from '../store.js'
import { adoptPet, formatPetStatus, getPetPassives, getPetSpecies, listPetSpecies, renamePet, syncPetState } from '../pets.js'

const PAW = '\u{1F43E}'
const GUIDE = '\u{1F9ED}'
const SPARKLES = '\u2728'
const MONEY = '\u{1F4B8}'
const SWORDS = '\u2694\uFE0F'
const WARN = '\u26A0\uFE0F'
const STAR = '\u{1F320}'
const GALAXY = '\u{1F30C}'

export default {
  name: 'pet',
  aliases: ['mascota', 'companion'],
  description: 'Gestiona tu companion astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, args, msg, db }) {
    const user = ensureUser(db, sender)
    const action = (args[0] || '').toLowerCase()

    if (!action) {
      const pet = syncPetState(user)
      if (!pet) {
        const speciesLines = listPetSpecies().map(
          species => `${species.emoji} *${species.key}* - ${species.kind}\n${species.description}`
        )

        return sock.sendMessage(from, {
          text:
            `${PAW} *COMPANIONS ASTRALES*\n\n` +
            'Aun no tienes una mascota orbital.\n\n' +
            speciesLines.join('\n\n') +
            `\n\n${GUIDE} Usa *.pet adoptar especie nombre*.\nEjemplo: *.pet adoptar draco Nova*`
        }, { quoted: msg })
      }

      const passive = getPetPassives(user)
      saveDB(db)

      return sock.sendMessage(from, {
        text:
          `${getPetSpecies(pet.species)?.emoji || PAW} *COMPANION ASTRAL*\n\n` +
          `${formatPetStatus(pet)}\n\n` +
          `${MONEY} Bonus economy: *+${Math.round(passive.economyMultiplier * 100)}%*\n` +
          `${SWORDS} Bonus raid: *+${passive.bossBonus}* dano\n\n` +
          `${GUIDE} Usa *.feedpet* para alimentarlo y *.playpet* para subirle el animo.`
      }, { quoted: msg })
    }

    if (action === 'adoptar' || action === 'adopt') {
      const speciesKey = args[1] || ''
      const name = args.slice(2).join(' ')
      const result = adoptPet(user, speciesKey, name)
      if (result.error) {
        return sock.sendMessage(from, { text: `${WARN} ${result.error}` }, { quoted: msg })
      }

      saveDB(db)
      return sock.sendMessage(from, {
        text:
          `${result.species.emoji} *COMPANION ASTRAL VINCULADO*\n\n` +
          `Especie: *${result.species.kind}*\n` +
          `Nombre: *${result.pet.name}*\n\n` +
          `${SPARKLES} Tu nuevo companion ya orbita contigo.\n` +
          `${GUIDE} Alimentalo con *.feedpet* y juega con *.playpet*.`
      }, { quoted: msg })
    }

    if (action === 'renombrar' || action === 'rename') {
      const result = renamePet(user, args.slice(1).join(' '))
      if (result.error) {
        return sock.sendMessage(from, { text: `${WARN} ${result.error}` }, { quoted: msg })
      }

      saveDB(db)
      return sock.sendMessage(from, {
        text: `${STAR} Tu companion ahora responde al nombre de *${result.pet.name}*.`
      }, { quoted: msg })
    }

    if (action === 'especies' || action === 'species') {
      return sock.sendMessage(from, {
        text: [
          `${GALAXY} *ESPECIES DISPONIBLES*`,
          '',
          ...listPetSpecies().map(
            species => `${species.emoji} *${species.key}* - ${species.kind}\n${species.description}`
          )
        ].join('\n\n')
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text:
        `${GUIDE} *USO DE PET*\n\n` +
        `- *.pet*\n` +
        `- *.pet especies*\n` +
        `- *.pet adoptar especie nombre*\n` +
        `- *.pet renombrar nombre*\n` +
        `- *.feedpet [petfood|apple]*\n` +
        `- *.playpet*`
    }, { quoted: msg })
  }
}
