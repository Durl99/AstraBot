const INVISIBLE_SEPARATOR = String.fromCharCode(8206).repeat(4000)
const GUIDE = '\u{1F9ED}'

export default {
  name: 'readmore',
  aliases: ['rm'],
  description: 'Crea un mensaje expandible con sello astral',
  category: 'tools',
  cooldown: 2,
  async run({ sock, from, args, msg }) {
    const raw = args.join(' ').trim()
    const parts = raw.split('|')

    if (parts.length < 2 || !parts[0]?.trim() || !parts[1]?.trim()) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE READMORE*\n\n` +
          'Usa *.readmore texto visible | texto oculto*\n\n' +
          'Ejemplo:\n' +
          '- *.readmore Astra abre el portal | Aqui va el contenido oculto*'
      }, { quoted: msg })
    }

    const visible = parts[0].trim()
    const hidden = parts.slice(1).join('|').trim()

    await sock.sendMessage(from, {
      text: `${visible}\n${INVISIBLE_SEPARATOR}\n${hidden}`
    }, { quoted: msg })
  }
}
