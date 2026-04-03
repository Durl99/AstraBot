import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'
import { getTargetUser } from '../utils.js'

export default {
  name: 'marry',
  aliases: [],
  description: 'Envía una propuesta de vínculo astral',
  category: 'fun',
  groupOnly: true,
  cooldown: 5,
  async run({ sock, from, sender, msg, db }) {
    const target = getTargetUser(msg)
    if (!target || target === sender) {
      return sock.sendMessage(from, { text: '🧭 Menciona o responde a la persona a la que quieres proponerle.' })
    }

    if (db.marriages[sender] || db.marriages[target]) {
      return sock.sendMessage(from, { text: AstraText.alreadyMarried })
    }

    const existing = db.proposals[target]
    if (existing && existing.from === sender && Date.now() < existing.expiresAt) {
      return sock.sendMessage(from, { text: AstraText.alreadyPendingProposal })
    }

    db.proposals[target] = {
      from: sender,
      expiresAt: Date.now() + 10 * 60 * 1000
    }

    saveDB(db)

    await sock.sendMessage(from, {
      text: `${AstraText.marryProposalSent(target)}\n\n${AstraText.marryProposalReceived(sender)}`,
      mentions: [target, sender]
    })
  }
}