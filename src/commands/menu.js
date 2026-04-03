import { AstraText } from '../astramessages.js'

export default {
  name: 'menu',
  aliases: ['help'],
  description: 'Despliega el núcleo de comandos',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, commands, config }) {
    const grouped = {}

    for (const cmd of commands) {
      const cat = cmd.category || 'otros'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(cmd)
    }

    const lines = AstraText.menuHeader(config.botName, config.prefix, commands.length)

    for (const [cat, cmds] of Object.entries(grouped)) {
      lines.push(`▢ ${cat.toUpperCase()}`)
      for (const c of cmds) {
        const flags = [
          c.ownerOnly ? 'owner' : null,
          c.adminOnly ? 'admin' : null,
          c.groupOnly ? 'group' : null,
          c.privateOnly ? 'private' : null
        ].filter(Boolean)

        const extra = flags.length ? ` [${flags.join(', ')}]` : ''
        lines.push(`• ${config.prefix}${c.name} — ${c.description || 'sin descripción'}${extra}`)
      }
      lines.push('')
    }

    await sock.sendMessage(from, { text: lines.join('\n') })
  }
}