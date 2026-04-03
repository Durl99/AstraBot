export default {
  name: 'marriage',
  aliases: ['pareja', 'casado'],
  description: 'Muestra tu vínculo astral actual',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const partner = db.marriages?.[sender]
    const proposal = db.proposals?.[sender]

    if (partner) {
      return sock.sendMessage(from, {
        text: `💍 *VÍNCULO ASTRAL*\n\nTu pareja actual es @${partner.split('@')[0]}.`,
        mentions: [partner]
      })
    }

    if (proposal) {
      if (Date.now() > proposal.expiresAt) {
        delete db.proposals[sender]
        return sock.sendMessage(from, {
          text: '⌛ Tu propuesta astral pendiente ya expiró.'
        })
      }

      return sock.sendMessage(from, {
        text: `🛰️ *PROPUESTA PENDIENTE*\n\nTienes una propuesta de @${proposal.from.split('@')[0]}.\nResponde con *.accept* o *.reject*.`,
        mentions: [proposal.from]
      })
    }

    await sock.sendMessage(from, {
      text: '🌙 No tienes vínculo astral activo ni propuestas pendientes.'
    })
  }
}