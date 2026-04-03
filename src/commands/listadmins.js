import { AstraText } from '../astramessages.js'

export default {
  name: 'listadmins',
  aliases: ['admins'],
  description: 'Lista el mando estelar del grupo',
  category: 'group',
  groupOnly: true,
  cooldown: 3,
  async run({ sock, from }) {
    const metadata = await sock.groupMetadata(from)
    const admins = metadata.participants.filter(
      p => p.admin === 'admin' || p.admin === 'superadmin'
    )

    let text = `${AstraText.listAdminsTitle}\n\n`
    for (const admin of admins) {
      text += `• @${String(admin.id).split('@')[0]}\n`
    }

    await sock.sendMessage(from, {
      text,
      mentions: admins.map(a => a.id)
    })
  }
}