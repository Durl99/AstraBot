import { AstraText } from '../astramessages.js'

export default {
  name: 'leave',
  aliases: ['salir'],
  description: 'Hace que el bot salga del grupo',
  category: 'owner',
  ownerOnly: true,
  groupOnly: true,
  cooldown: 3,
  async run({ sock, from }) {
    await sock.sendMessage(from, { text: AstraText.leaving })
    await sock.groupLeave(from)
  }
}
