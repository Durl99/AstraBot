import util from 'util'

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
      return sock.sendMessage(from, { text: '⚠️ Ingresa código.' })
    }

    try {
      let result

      if (code.includes(';') || code.includes('return ') || code.includes('\n')) {
        result = await eval(`(async () => { ${code} })()`)
      } else {
        result = await eval(code)
      }

      if (typeof result !== 'string') {
        result = util.inspect(result, { depth: 2 })
      }

      if (!result) result = 'undefined'

      await sock.sendMessage(from, {
        text: `🌌 *ASTRA EVAL*\n\n${String(result).slice(0, 3500)}`
      }, { quoted: msg })
    } catch (e) {
      await sock.sendMessage(from, {
        text: `💥 ERROR\n\n${String(e).slice(0, 3500)}`
      }, { quoted: msg })
    }
  }
}
