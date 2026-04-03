import util from 'util'
import { AstraText } from '../astramessages.js'

export default {
  name: 'eval',
  aliases: ['>'],
  description: 'Ejecuta JavaScript en el núcleo astral',
  category: 'owner',
  ownerOnly: true,
  cooldown: 1,
  async run({ sock, from, args, msg, db, config }) {
    const code = args.join(' ')
    if (!code) {
      return sock.sendMessage(from, { text: AstraText.noCode })
    }

    try {
      let result = await eval(`(async () => { ${code} })()`)
      if (typeof result !== 'string') {
        result = util.inspect(result, { depth: 1 })
      }

      if (!result) result = 'undefined'

      await sock.sendMessage(from, {
        text: AstraText.evalResult(String(result).slice(0, 3500))
      }, { quoted: msg })
    } catch (e) {
      await sock.sendMessage(from, {
        text: AstraText.evalResult(String(e).slice(0, 3500))
      }, { quoted: msg })
    }
  }
}