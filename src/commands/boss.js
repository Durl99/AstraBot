import { getBoss, getBossClanTop, getBossTop, summonBoss } from '../boss.js'

export default {
  name: 'boss',
  aliases: ['raid', 'worldboss'],
  description: 'Invoca o consulta el boss grupal astral',
  category: 'group',
  groupOnly: true,
  cooldown: 4,
  async run({ sock, from, args, msg, db }) {
    const action = (args[0] || 'status').toLowerCase()

    if (action === 'summon' || action === 'spawn') {
      const result = summonBoss(db, from)
      if (result.error) {
        return sock.sendMessage(from, {
          text: `⚠️ ${result.error}`
        }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text:
          `${result.boss.emoji} *BOSS ASTRAL INVOCADO*\n\n` +
          `Nombre: *${result.boss.name}*\n` +
          `Vida: *${result.boss.hp}/${result.boss.maxHp}*\n\n` +
          '⚔️ Usa *.attackboss* para atacar.\n' +
          '📡 Usa *.boss* para ver el estado del raid.'
      }, { quoted: msg })
    }

    const boss = getBoss(db.groups?.[from])
    if (!boss || boss.defeated) {
      return sock.sendMessage(from, {
        text: '🌌 No hay un boss activo en esta orbita. Usa *.boss summon* para invocar uno.'
      }, { quoted: msg })
    }

    const top = getBossTop(boss)
    const clanTop = getBossClanTop(db, boss)
    const lines = [
      `${boss.emoji} *RAID ASTRAL EN CURSO*`,
      '',
      `Boss: *${boss.name}*`,
      `Vida: *${boss.hp}/${boss.maxHp}*`,
      '',
      top.length
        ? top.map((entry, index) => `${index + 1}. @${entry.jid.split('@')[0]} - *${entry.damage}* daño`).join('\n')
        : 'Aun nadie ha golpeado al boss.',
      '',
      clanTop.length
        ? '🏳️ Clanes en combate:\n' + clanTop.map((entry, index) => `${index + 1}. *${entry.clanName}* - *${entry.damage}* daño`).join('\n')
        : 'Aun no hay clanes participando en este raid.',
      '',
      '⚔️ Usa *.attackboss* para sumarte al combate.'
    ]

    await sock.sendMessage(from, {
      text: lines.join('\n'),
      mentions: top.map(entry => entry.jid)
    }, { quoted: msg })
  }
}
