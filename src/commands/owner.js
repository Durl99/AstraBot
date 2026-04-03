import { config } from '../config.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'owner',
  aliases: ['creador', 'dueno'],
  description: 'Muestra el núcleo de mando',
  category: 'info',
  cooldown: 3,
  async run({ sock, from }) {
    const owner = config.owner[0] || 'No configurado'
    await sock.sendMessage(from, { text: AstraText.owner(config.botName, owner) })
  }
}