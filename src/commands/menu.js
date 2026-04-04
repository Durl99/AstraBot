import fs from 'fs'
import path from 'path'
import { AstraText } from '../astramessages.js'

const MENU_IMAGE_PATH = path.resolve('src/assets/menu-astrabot.png')

export default {
  name: 'menu',
  aliases: ['help', 'menua'],
  description: 'Despliega el nucleo de comandos astrales',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, commands, config }) {
    const categoryOrder = ['main', 'info', 'group', 'moderation', 'media', 'fun', 'owner']

    const categoryMeta = {
      main: { emoji: '🚀', title: 'NUCLEO PRINCIPAL' },
      info: { emoji: '🛰️', title: 'INFORMACION ASTRAL' },
      group: { emoji: '🌌', title: 'GESTION DE ORBITA' },
      moderation: { emoji: '🛡️', title: 'MODERACION ESTELAR' },
      media: { emoji: '🪐', title: 'MEDIA Y RELIQUIAS' },
      fun: { emoji: '🎮', title: 'DIVERSION GALACTICA' },
      owner: { emoji: '👑', title: 'NUCLEO DE MANDO' },
      otros: { emoji: '✨', title: 'OTROS MODULOS' }
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

    const lines = [...AstraText.menuIntro(config.botName, config.prefix, commands.length)]

    for (const cat of sortedCategories) {
      const meta = categoryMeta[cat] || categoryMeta.otros
      const cmds = grouped[cat].sort((a, b) => a.name.localeCompare(b.name))

      lines.push(`${meta.emoji} *${meta.title}*`)
      lines.push('────────────────────')

      for (const c of cmds) {
        const flags = [
          c.ownerOnly ? '👑' : null,
          c.adminOnly ? '🛡️' : null,
          c.groupOnly ? '👥' : null,
          c.privateOnly ? '📩' : null
        ].filter(Boolean).join(' ')

        lines.push(
          `✦ *${config.prefix}${c.name}* - ${c.description || 'sin descripcion'}${flags ? ` ${flags}` : ''}`
        )
      }

      lines.push('')
    }

    lines.push('🌙 *AstraBot domina la orbita.*')

    const caption = lines.join('\n')
    const image = fs.readFileSync(MENU_IMAGE_PATH)

    await sock.sendMessage(from, {
      image,
      caption
    })
  }
}
