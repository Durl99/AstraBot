export default {
  name: 'say',
  aliases: ['decir'],
  description: 'Hace que AstraBot retransmita un mensaje',
  category: 'tools',
  ownerOnly: true,
  cooldown: 2,
  async run({ sock, from, args }) {
    const text = args.join(' ')
    if (!text) {
      return sock.sendMessage(from, {
        text: '🧭 Escribe el mensaje que quieres que AstraBot transmita a la orbita.'
      })
    }

    await sock.sendMessage(from, { text })
  }
}
