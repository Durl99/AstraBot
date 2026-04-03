import { AstraText } from '../astramessages.js'

export default {
  name: 'tagadmins',
  aliases: ['invocaradmins'],
  description: 'Invoca al mando estelar',
  category: 'group',
  groupOnly: true,
  cooldown: 5,
  async run({ sock, from, args }) {
    const metadata = await sock.groupMetadata(from)
    const admins = metadata.participants.filter(
      p => p.admin === 'admin' || p.admin === 'superadmin'
    )

    const reason = args.join(' ') || AstraText.tagAdminsTitle

    await sock.sendMessage(from, {
      text: `${reason}\n\n${admins.map(a => `@${String(a.id).split('@')[0]}`).join('\n')}`,
      mentions: admins.map(a => a.id)
    })
  }
}