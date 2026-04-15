const GUIDE = '\u{1F9ED}'
const MEGAPHONE = '\u{1F4E2}'

export default {
  name: 'bc',
  aliases: ['broadcast'],
  description: 'Envia un anuncio astral a todos los grupos del bot',
  category: 'owner',
  ownerOnly: true,
  cooldown: 10,
  async run({ sock, args, from }) {
    const text = args.join(' ')
    if (!text) {
      return sock.sendMessage(from, {
        text: `${GUIDE} Escribe el mensaje que AstraBot debe transmitir a todas las orbitas.`
      })
    }

    const groups = await sock.groupFetchAllParticipating()
    const ids = Object.keys(groups)

    for (const id of ids) {
      try {
        await sock.sendMessage(id, {
          text: `${MEGAPHONE} *BROADCAST ASTRAL DE ASTRA BOT*\n\n${text}`
        })
      } catch (e) {
        console.error('Error enviando broadcast a', id, e)
      }
    }
  }
}
