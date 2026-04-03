import { AstraText } from '../astramessages.js'

export default {
  name: 'ping',
  aliases: ['p'],
  description: 'Verifica la señal astral',
  category: 'main',
  cooldown: 2,
  async run({ sock, from }) {
    await sock.sendMessage(from, { text: AstraText.pong })
  }
}