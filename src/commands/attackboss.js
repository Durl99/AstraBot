import { attackBoss, getBossTop } from '../boss.js'
import { getShopItem } from '../economy.js'

function formatTime(ms) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  const parts = []
  if (m) parts.push(`${m}m`)
  if (sec || !parts.length) parts.push(`${sec}s`)
  return parts.join(' ')
}

export default {
  name: 'attackboss',
  aliases: ['aboss', 'golpeboss'],
  description: 'Ataca al boss grupal de la orbita',
  category: 'group',
  groupOnly: true,
  cooldown: 2,
  async run({ sock, from, sender, msg, db }) {
    const result = attackBoss(db, from, sender)

    if (result.error) {
      const leftLine = result.left ? `\nRecarga restante: *${formatTime(result.left)}*` : ''
      return sock.sendMessage(from, {
        text: `⚠️ ${result.error}${leftLine}`
      }, { quoted: msg })
    }

    if (result.defeated) {
      const top = getBossTop(result.boss, 10)
      const rewardLines = result.rewards.map(
        reward => `@${reward.jid.split('@')[0]} - *${reward.damage}* daño | *${reward.reward}* coins`
      )
      const dropItem = getShopItem(result.drop?.itemKey || '')
      const dropLine = dropItem && result.drop?.winner
        ? `\n\n🎁 Drop raro: @${result.drop.winner.split('@')[0]} recibio *${dropItem.name}* x${result.drop.qty}.`
        : ''

      return sock.sendMessage(from, {
        text:
          `${result.boss.emoji} *BOSS DERROTADO*\n\n` +
          `Boss: *${result.boss.name}*\n` +
          `Golpe final: *@${sender.split('@')[0]}* hizo *${result.damage}* daño.\n\n` +
          '🏆 Recompensas:\n' +
          rewardLines.join('\n') +
          dropLine +
          '\n\n🌠 El raid astral fue completado.',
        mentions: [...top.map(entry => entry.jid), sender, ...(result.drop?.winner ? [result.drop.winner] : [])]
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text:
        `${result.boss.emoji} *ATAQUE REGISTRADO*\n\n` +
        `Daño causado: *${result.damage}*\n` +
        `Daño total tuyo: *${result.participantDamage}*\n` +
        `Vida restante del boss: *${result.boss.hp}/${result.boss.maxHp}*\n\n` +
        '⚔️ Sigue atacando hasta derribarlo.',
      mentions: [sender]
    }, { quoted: msg })
  }
}
