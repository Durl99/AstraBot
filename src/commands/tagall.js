export default {
  name: 'tagall',
  aliases: ['everyone'],
  description: 'Menciona a todos en el grupo',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, msg, args }) {
    const metadata = await sock.groupMetadata(from)
    const users = metadata.participants.map(p => p.id)
    const reason = args.join(' ') || 'Atención todos'

    let text = `📢 ${reason}\n\n`
    for (const user of users) {
      text += `@${user.split('@')[0]}\n`
    }

    await sock.sendMessage(from, {
      text,
      mentions: users
    }, { quoted: msg })
  }
}