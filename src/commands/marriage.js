export default {
  name: 'marriage',
  aliases: ['pareja', 'casado'],
  description: 'Muestra tu vinculo astral actual',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const partner = db.marriages?.[sender]
    const proposal = db.proposals?.[sender]

    if (partner) {
      return sock.sendMessage(from, {
        text: `💍 *VINCULO ASTRAL ACTIVO*\n\nTu pareja orbital actual es @${partner.split('@')[0]}.`,
        mentions: [partner]
      })
    }

    if (proposal) {
      if (Date.now() > proposal.expiresAt) {
        delete db.proposals[sender]
        return sock.sendMessage(from, {
          text: '⌛ Tu propuesta astral pendiente se disolvio por el paso del tiempo cosmico.'
        })
      }

      return sock.sendMessage(from, {
        text:
          `🛰️ *PROPUESTA ASTRAL PENDIENTE*\n\n` +
          `Tienes una propuesta de @${proposal.from.split('@')[0]}.\n` +
          'Responde con *.accept* o *.reject* para definir tu destino orbital.',
        mentions: [proposal.from]
      })
    }

    await sock.sendMessage(from, {
      text: '🌙 No tienes vinculo astral activo ni propuestas pendientes en tu constelacion.'
    })
  }
}
