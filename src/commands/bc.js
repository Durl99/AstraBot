export default {
  name: 'bc',
  aliases: ['broadcast'],
  description: 'Envía un anuncio a todos los grupos del bot',
  category: 'owner',
  ownerOnly: true,
  cooldown: 10,
  async run({ sock, args }) {
    const text = args.join(' ')
    if (!text) return

    const groups = await sock.groupFetchAllParticipating()
    const ids = Object.keys(groups)

    for (const id of ids) {
      try {
        await sock.sendMessage(id, {
          text: `📢 *Broadcast AstraBot*\n\n${text}`
        })
      } catch (e) {
        console.error('Error enviando broadcast a', id, e)
      }
    }
  }
}