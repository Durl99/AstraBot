import { exec } from 'child_process'
import { AstraText } from '../astramessages.js'

export default {
  name: 'exec',
  aliases: ['$'],
  description: 'Ejecuta comandos de terminal en el núcleo',
  category: 'owner',
  ownerOnly: true,
  cooldown: 1,
  async run({ sock, from, args, msg }) {
    const command = args.join(' ')
    if (!command) {
      return sock.sendMessage(from, { text: AstraText.noCode })
    }

    exec(command, { timeout: 15000 }, async (error, stdout, stderr) => {
      let output = stdout || stderr || error?.message || 'sin salida'
      output = String(output).slice(0, 3500)

      await sock.sendMessage(from, {
        text: AstraText.execResult(output)
      }, { quoted: msg })
    })
  }
}