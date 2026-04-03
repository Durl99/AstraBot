export default {
  name: 'say',
  aliases: ['decir'],
  description: 'Hace que el bot repita un mensaje',
  category: 'tools',
  ownerOnly: true,
  cooldown: 2,
  async run({ sock, from, args }) {
    const text = args.join(' ')
    if (!text) {
      return sock.sendMessage(from, { text: 'Escribe el mensaje que quieres que envíe.' })
    }

    await sock.sendMessage(from, { text })
  }
}