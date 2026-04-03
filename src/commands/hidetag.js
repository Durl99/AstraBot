export default {
  name: 'hidetag',
  aliases: ['notify'],
  description: 'Menciona a todos sin listar nombres',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg, args }) {
    const metadata = await sock.groupMetadata(from)
    const users = metadata.participants.map(p => p.id)
    const text = args.join(' ') || 'Mensaje para todos.'

    await sock.sendMessage(from, {
      text,
      mentions: users
    }, { quoted: msg })
  }
}