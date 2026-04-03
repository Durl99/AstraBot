import { AstraText } from '../astramessages.js'

export default {
  name: 'ownerlist',
  aliases: ['owners'],
  description: 'Lista el núcleo de mando',
  category: 'owner',
  ownerOnly: true,
  cooldown: 3,
  async run({ sock, from, config }) {
    const owners = config.owner || []

    let text = `${AstraText.ownerListTitle}\n\n`
    for (const owner of owners) {
      text += `• ${owner}\n`
    }

    await sock.sendMessage(from, { text })
  }
}