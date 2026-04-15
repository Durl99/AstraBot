import { attackBoss, getBossTop } from '../boss.js'
import { getShopItem } from '../economy.js'

const WARN = '\u26A0\uFE0F'
const TROPHY = '\u{1F3C6}'
const GIFT = '\u{1F381}'
const STAR = '\u{1F320}'
const SWORDS = '\u2694\uFE0F'

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
        text: `${WARN} ${result.error}${leftLine}`
      }, { quoted: msg })
    }

    if (result.defeated) {
      const top = getBossTop(result.boss, 10)
      const rewardLines = result.rewards.map(
        reward => `@${reward.jid.split('@')[0]} - *${reward.damage}* dano | *${reward.reward}* coins`
      )
      const dropItem = getShopItem(result.drop?.itemKey || '')
      const dropLine = dropItem && result.drop?.winner
        ? `\n\n${GIFT} Drop raro: @${result.drop.winner.split('@')[0]} recibio *${dropItem.name}* x${result.drop.qty}.`
        : ''

      return sock.sendMessage(from, {
        text:
          `${result.boss.emoji} *BOSS DERROTADO*\n\n` +
          `Boss: *${result.boss.name}*\n` +
          `Golpe final: *@${sender.split('@')[0]}* hizo *${result.damage}* dano${result.petBonus ? ` (+${result.petBonus} companion)` : ''}.\n\n` +
          `${TROPHY} Recompensas:\n` +
          rewardLines.join('\n') +
          dropLine +
          `\n\n${STAR} El raid astral fue completado.`,
        mentions: [...top.map(entry => entry.jid), sender, ...(result.drop?.winner ? [result.drop.winner] : [])]
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text:
        `${result.boss.emoji} *ATAQUE REGISTRADO*\n\n` +
        `Dano causado: *${result.damage}*${result.petBonus ? ` (+${result.petBonus} companion)` : ''}\n` +
        `Dano total tuyo: *${result.participantDamage}*\n` +
        `Vida restante del boss: *${result.boss.hp}/${result.boss.maxHp}*\n\n` +
        `${SWORDS} Sigue atacando hasta derribarlo.`,
      mentions: [sender]
    }, { quoted: msg })
  }
}
