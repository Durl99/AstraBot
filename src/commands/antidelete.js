import { ensureGroup, saveDB } from '../store.js'

const GUIDE = '\u{1F9ED}'
const SATELLITE = '\u{1F6F0}\uFE0F'
const NEW_MOON = '\u{1F311}'

export default {
  name: 'antidelete',
  aliases: ['antiborrar'],
  description: 'Protege la orbita de mensajes borrados',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db }) {
    const value = (args[0] || '').toLowerCase()

    if (!['on', 'off', 'test'].includes(value)) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE ANTIDELETE*\n\n` +
          'Usa *.antidelete on*, *.antidelete off* o *.antidelete test* para controlar el radar anti-borrado.'
      })
    }

    const group = ensureGroup(db, from)

    if (value === 'test') {
      return sock.sendMessage(from, {
        text:
          `${SATELLITE} *PRUEBA DE ANTIDELETE*\n\n` +
          'El radar astral esta listo. Envia un mensaje y borralo para comprobar si AstraBot rescata la senal.'
      })
    }

    group.antidelete = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.antidelete
        ? `${SATELLITE} El radar antidelete quedo activado. AstraBot vigilara mensajes eliminados en esta orbita.`
        : `${NEW_MOON} El radar antidelete quedo desactivado en esta orbita.`
    })
  }
}
