export default {
  name: 'join',
  aliases: [],
  description: 'Hace que el bot entre a un grupo por enlace',
  category: 'owner',
  ownerOnly: true,
  cooldown: 5,
  async run({ sock, from, args }) {
    const link = args[0] || ''
    const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)

    if (!match) {
      return sock.sendMessage(from, { text: 'Pega un enlace válido de invitación.' })
    }

    try {
      await sock.groupAcceptInvite(match[1])
      await sock.sendMessage(from, { text: 'Entré al grupo.' })
    } catch {
      await sock.sendMessage(from, { text: 'No pude entrar con ese enlace.' })
    }
  }
}