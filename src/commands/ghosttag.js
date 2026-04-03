import { AstraText } from '../astramessages.js'

export default {
  name: 'ghosttag',
  aliases: ['gtag'],
  description: 'Menciona a todos en silencio',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async run({ sock, from, args }) {
    const metadata = await sock.groupMetadata(from)
    const users = metadata.participants.map(p => p.id)
    const text = args.join(' ') || AstraText.ghosttagTitle

    await sock.sendMessage(from, {
      text,
      mentions: users
    })
  }
}