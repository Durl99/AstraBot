import { config } from '../config.js'
import { ensureGroup, saveDB } from '../store.js'
import { getContextInfo, getTextMessage } from '../utils.js'
import {
  ensureMarkovState,
  generateMarkovPreview,
  getMarkovLimits,
  getMarkovSummary,
  learnAndGenerateMarkov,
  resetMarkov,
  setMarkovEnabled,
  setMarkovInterval
} from '../markov.js'

const GUIDE = '\u{1F9ED}'
const WARN = '\u26A0\uFE0F'
const BRAIN = '\u{1F9E0}'
const SATELLITE = '\u{1F6F0}\uFE0F'
const TEST_TUBE = '\u{1F9EA}'
const SPARKLES = '\u2728'

function isAllowed(isOwner, isAdmin) {
  return Boolean(isOwner || isAdmin)
}

function jidUserPart(jid = '') {
  return String(jid).split('@')[0].split(':')[0]
}

function isReplyingToBot(msg, sock) {
  const ctx = getContextInfo(msg)
  const quotedParticipant = ctx?.participant
  if (!quotedParticipant) return false

  const botCandidates = [sock.user?.id, sock.user?.lid, sock.user?.jid]
    .filter(Boolean)
    .map(jidUserPart)

  return botCandidates.includes(jidUserPart(quotedParticipant))
}

export default {
  name: 'markov',
  aliases: ['mkv'],
  description: 'Activa el piloto markov automatico del grupo',
  category: 'group',
  groupOnly: true,
  cooldown: 3,
  async run({ sock, from, args, msg, db, isOwner, isAdmin }) {
    if (!isAllowed(isOwner, isAdmin)) {
      return sock.sendMessage(from, { text: 'Solo admins del grupo o el owner pueden tocar el nucleo Markov.' }, { quoted: msg })
    }

    const group = ensureGroup(db, from)
    const markov = ensureMarkovState(group)
    const action = (args[0] || 'status').toLowerCase()
    const limits = getMarkovLimits()

    if (action === 'status' || action === 'estado') {
      const summary = getMarkovSummary(group)
      return sock.sendMessage(from, {
        text:
          `${BRAIN} *NUCLEO MARKOV ASTRAL*\n\n` +
          `Estado: *${summary.enabled ? 'activo' : 'apagado'}*\n` +
          `Intervalo: *${summary.interval}* mensajes\n` +
          `Carga actual: *${summary.pending}/${summary.interval}*\n` +
          `Memoria orbital: *${summary.corpusSize}* mensajes\n` +
          `Listo para hablar: *${summary.ready ? 'si' : 'todavia aprendiendo'}*\n\n` +
          `${GUIDE} Usa *.markov on*, *.markov off*, *.markov interval 8*, *.markov test* o *.markov reset*.`
      }, { quoted: msg })
    }

    if (action === 'on') {
      setMarkovEnabled(group, true)
      saveDB(db)
      return sock.sendMessage(from, {
        text:
          `${SATELLITE} El nucleo Markov quedo *activo*.\n\n` +
          `Aprendere del chat, aceptare palabras de 2 letras o mas y hablare automaticamente cada *${markov.interval}* mensajes validos.`
      }, { quoted: msg })
    }

    if (action === 'off') {
      setMarkovEnabled(group, false)
      saveDB(db)
      return sock.sendMessage(from, {
        text: `${SATELLITE} El nucleo Markov quedo *apagado*. AstraBot deja de intervenir automaticamente.`
      }, { quoted: msg })
    }

    if (action === 'interval' || action === 'intervalo') {
      const value = Number(args[1] || 0)
      if (!Number.isFinite(value)) {
        return sock.sendMessage(from, {
          text: `${WARN} Debes indicar un numero valido. Minimo *${limits.minInterval}* y maximo *${limits.maxInterval}*.`
        }, { quoted: msg })
      }

      const finalValue = Math.max(limits.minInterval, Math.min(limits.maxInterval, Math.floor(value)))
      setMarkovInterval(group, finalValue)
      saveDB(db)

      return sock.sendMessage(from, {
        text: `${SPARKLES} El intervalo Markov ahora es de *${finalValue}* mensajes validos.`
      }, { quoted: msg })
    }

    if (action === 'test') {
      const seedText = args.slice(1).join(' ').trim()
      const generated = generateMarkovPreview(group, seedText)

      if (!generated) {
        return sock.sendMessage(from, {
          text:
            `${TEST_TUBE} Aun no tengo suficiente memoria orbital para una prueba convincente.\n\n` +
            `Necesito al menos *${limits.minCorpusForReply}* mensajes validos aprendidos en este grupo.`
        }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: generated
      }, { quoted: msg })
    }

    if (action === 'reset' || action === 'clear' || action === 'limpiar') {
      resetMarkov(group)
      saveDB(db)
      return sock.sendMessage(from, {
        text: `${BRAIN} La memoria Markov del grupo fue limpiada. Toca volver a aprender la orbita desde cero.`
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text:
        `${GUIDE} *USO DE MARKOV*\n\n` +
        '- *.markov*\n' +
        '- *.markov on*\n' +
        '- *.markov off*\n' +
        '- *.markov interval 8*\n' +
        '- *.markov test*\n' +
        '- *.markov reset*'
    }, { quoted: msg })
  },

  async onMessage({ sock, msg, from, db }) {
    if (!from?.endsWith('@g.us')) return
    if (msg.key?.fromMe) return

    const group = ensureGroup(db, from)
    const body = getTextMessage(msg).trim()
    if (!body) return

    const shouldReplyToBot = group.markov?.enabled && isReplyingToBot(msg, sock)
    const result = learnAndGenerateMarkov(group, body, config.prefix)

    if (result.changed) {
      saveDB(db)
    }

    let generated = result.generated
    if (!generated && shouldReplyToBot) {
      generated = generateMarkovPreview(group, body)
    }

    if (!group.markov?.enabled || !generated) return

    try {
      await sock.sendMessage(from, {
        text: generated
      }, { quoted: msg })
    } catch (error) {
      console.error('Error markov:', error)
    }
  }
}
