import { ensureGroup, saveDB } from '../store.js'
import { sendByePreview } from '../groupwelcome.js'

export default {
  name: 'bye',
  aliases: ['despedida'],
  description: 'Activa o desactiva las despedidas astrales',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 3,
  async run({ sock, from, args, db, sender }) {
    const value = (args[0] || '').toLowerCase()

    if (!['on', 'off', 'test'].includes(value)) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO CORRECTO DE BYE*\n\n' +
          'Usa *.bye on*, *.bye off* o *.bye test* para controlar la despedida astral.'
      })
    }

    const group = ensureGroup(db, from)

    if (value === 'test') {
      const metadata = await sock.groupMetadata(from).catch(() => null)
      const groupName = metadata?.subject || 'esta orbita'

      await sendByePreview({
        sock,
        groupId: from,
        participant: sender,
        groupName,
        template: group.byeText
      })

      return
    }

    group.bye = value === 'on'
    saveDB(db)

    await sock.sendMessage(from, {
      text: group.bye
        ? '🌙 La despedida astral quedo activada. AstraBot enviara su sello visual cuando alguien abandone la orbita.'
        : '🛰️ La despedida astral quedo desactivada en esta orbita.'
    })
  }
}
