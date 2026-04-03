export default {
  name: 'menu',
  aliases: ['help', 'menú'],
  description: 'Despliega el núcleo de comandos astrales',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, commands, config }) {
    const categoryOrder = [
      'main',
      'info',
      'group',
      'moderation',
      'media',
      'fun',
      'owner'
    ]

    const categoryMeta = {
      main: { emoji: '🚀', title: 'NÚCLEO PRINCIPAL' },
      info: { emoji: '🛰️', title: 'INFORMACIÓN ASTRAL' },
      group: { emoji: '🌌', title: 'GESTIÓN DE ÓRBITA' },
      moderation: { emoji: '🛡️', title: 'MODERACIÓN ESTELAR' },
      media: { emoji: '🪐', title: 'MEDIA & RELIQUIAS' },
      fun: { emoji: '🎮', title: 'DIVERSIÓN GALÁCTICA' },
      owner: { emoji: '👑', title: 'NÚCLEO DE MANDO' },
      otros: { emoji: '✨', title: 'OTROS MÓDULOS' }
    }

    const grouped = {}

    for (const cmd of commands) {
      const cat = cmd.category || 'otros'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(cmd)
    }

    const sortedCategories = [
      ...categoryOrder.filter(cat => grouped[cat]),
      ...Object.keys(grouped).filter(cat => !categoryOrder.includes(cat))
    ]

    const lines = [
      '╔════════════════════╗',
      '║      ✦ ASTRA BOT ✦      ║',
      '╚════════════════════╝',
      '',
      `🌠 *Bot:* ${config.botName}`,
      `🧭 *Prefijo:* ${config.prefix}`,
      `📦 *Módulos cargados:* ${commands.length}`,
      '🛰️ *Estado:* señal astral estable',
      '',
      '━━━━━━━━━━━━━━━━━━'
    ]

    for (const cat of sortedCategories) {
      const meta = categoryMeta[cat] || categoryMeta.otros
      lines.push('')
      lines.push(`${meta.emoji} *${meta.title}*`)
      lines.push('──────────────────')

      const cmds = grouped[cat].sort((a, b) => a.name.localeCompare(b.name))

      for (const c of cmds) {
        const flags = [
          c.ownerOnly ? '👑' : null,
          c.adminOnly ? '🛡️' : null,
          c.groupOnly ? '👥' : null,
          c.privateOnly ? '📩' : null
        ].filter(Boolean).join(' ')

        const flagText = flags ? ` ${flags}` : ''
        lines.push(`✧ *${config.prefix}${c.name}* — ${c.description || 'sin descripción'}${flagText}`)
      }
    }

    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━')
    lines.push('🌙 *AstraBot domina la órbita.*')

    await sock.sendMessage(from, {
      text: lines.join('\n')
    })
  }
}