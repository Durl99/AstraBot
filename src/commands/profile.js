import { ensureUser, saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'
import { getTargetUser } from '../utils.js'

export default {
  name: 'profile',
  aliases: ['me', 'perfil'],
  description: 'Muestra el perfil astral',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg) || sender
    const user = ensureUser(db, target)

    const partnerJid = db.marriages?.[target] || null
    const proposal = db.proposals?.[target] || null

    const partner = partnerJid ? `@${partnerJid.split('@')[0]}` : 'Ninguna'

    let proposalText = 'Ninguna'
    if (proposal) {
      if (Date.now() > proposal.expiresAt) {
        delete db.proposals[target]
        saveDB(db)
      } else {
        proposalText = `De @${proposal.from.split('@')[0]}`
      }
    }

    const mentions = [target]
    if (partnerJid) mentions.push(partnerJid)
    if (proposal && Date.now() <= proposal.expiresAt) mentions.push(proposal.from)

    await sock.sendMessage(from, {
      text: AstraText.profile(target, user, {
        partner,
        proposal: proposalText
      }),
      mentions
    })
  }
}