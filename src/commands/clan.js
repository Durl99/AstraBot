import { createClan, disbandClan, donateClan, getClan, getClanTop, joinClan, leaveClan, transferClanLeadership } from '../clans.js'
import { getTargetUser } from '../utils.js'
import { ensureUser } from '../store.js'

export default {
  name: 'clan',
  aliases: ['faccion', 'guild'],
  description: 'Gestiona clanes astrales y su progreso',
  category: 'fun',
  cooldown: 4,
  async run({ sock, from, sender, args, msg, db }) {
    const action = (args[0] || '').toLowerCase()
    const user = ensureUser(db, sender)

    if (!action) {
      return sock.sendMessage(from, {
        text:
          '🧭 *USO DE CLAN*\n\n' +
          '• *.clan crear nombre*\n' +
          '• *.clan unirse codigo*\n' +
          '• *.clan info*\n' +
          '• *.clan miembros*\n' +
          '• *.clan donar 500*\n' +
          '• *.clan lider @usuario*\n' +
          '• *.clan disolver*\n' +
          '• *.clan top*\n' +
          '• *.clan salir*'
      }, { quoted: msg })
    }

    if (action === 'crear') {
      const name = args.slice(1).join(' ').trim()
      const result = createClan(db, sender, name)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text:
          '🌌 *CLAN ASTRAL FUNDADO*\n\n' +
          `Nombre: *${result.clan.name}*\n` +
          `Codigo: *${result.clan.code}*\n` +
          `Lider: *@${sender.split('@')[0]}*\n\n` +
          '🛰️ Usa ese codigo para reclutar mas tripulantes.',
        mentions: [sender]
      }, { quoted: msg })
    }

    if (action === 'unirse') {
      const code = args[1] || ''
      const result = joinClan(db, sender, code)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text:
          `✨ Te uniste al clan *${result.clan.name}*.\n` +
          `🧭 Codigo orbital: *${result.clan.code}*`
      }, { quoted: msg })
    }

    if (action === 'salir') {
      const result = leaveClan(db, sender)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: '🌙 Abandonaste tu clan astral y tu señal quedo libre en la galaxia.'
      }, { quoted: msg })
    }

    if (action === 'donar') {
      const amount = Number(args[1] || 0)
      const result = donateClan(db, sender, amount)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text:
          '💫 *DONACION REGISTRADA*\n\n' +
          `Clan: *${result.clan.name}*\n` +
          `Cantidad: *${result.amount}* coins\n` +
          `Banco del clan: *${result.clan.bank}*`
      }, { quoted: msg })
    }

    if (action === 'lider' || action === 'transferir') {
      const target = getTargetUser(msg)
      if (!target) {
        return sock.sendMessage(from, {
          text: '🧭 Menciona o responde al miembro que recibira el mando del clan.'
        }, { quoted: msg })
      }

      const result = transferClanLeadership(db, sender, target)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: `👑 El liderazgo del clan *${result.clan.name}* fue transferido a @${target.split('@')[0]}.`,
        mentions: [target]
      }, { quoted: msg })
    }

    if (action === 'disolver') {
      const result = disbandClan(db, sender)
      if (result.error) {
        return sock.sendMessage(from, { text: `⚠️ ${result.error}` }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: `🌑 El clan *${result.clan.name}* fue disuelto y su señal se disperso en la galaxia.`
      }, { quoted: msg })
    }

    if (action === 'top') {
      const top = getClanTop(db).slice(0, 10)
      if (!top.length) {
        return sock.sendMessage(from, {
          text: '🌌 Aun no hay clanes suficientes para formar el top astral.'
        }, { quoted: msg })
      }

      return sock.sendMessage(from, {
        text: [
          '🏆 *TOP DE CLANES ASTRABOT*',
          '',
          ...top.map((clan, index) =>
            `${index + 1}. *${clan.name}* [${clan.code}]\n👥 Miembros: *${clan.members.length}* | 🏦 Banco: *${clan.bank}* | ✨ Poder: *${clan.power}*`
          )
        ].join('\n\n')
      }, { quoted: msg })
    }

    if (action === 'miembros' || action === 'info') {
      if (!user.clanId) {
        return sock.sendMessage(from, {
          text: '🌑 No perteneces a ningun clan astral. Usa *.clan crear* o *.clan unirse*.'
        }, { quoted: msg })
      }

      const clan = getClan(db, user.clanId)
      if (!clan) {
        return sock.sendMessage(from, {
          text: '⚠️ Tu clan no pudo ser encontrado en la base astral.'
        }, { quoted: msg })
      }

      const mentions = clan.members
      const memberLines = clan.members.map(member => `• @${member.split('@')[0]}`)

      return sock.sendMessage(from, {
        text:
          `🌠 *CLAN ${clan.name.toUpperCase()}*\n\n` +
          `Codigo: *${clan.code}*\n` +
          `Lider: @${clan.leader.split('@')[0]}\n` +
          `Banco: *${clan.bank}* coins\n` +
          `XP del clan: *${clan.xp}*\n` +
          `Miembros: *${clan.members.length}*\n\n` +
          memberLines.join('\n'),
        mentions
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text: '🧭 Subcomando de clan no reconocido. Usa *.clan* para ver las opciones.'
    }, { quoted: msg })
  }
}
