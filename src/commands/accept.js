import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'accept',
  aliases: ['aceptar'],
  description: 'Acepta una propuesta astral pendiente',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const proposal = db.proposals[sender]

    if (!proposal) {
      return sock.sendMessage(from, { text: AstraText.noProposal })
    }

    if (Date.now() > proposal.expiresAt) {
      delete db.proposals[sender]
      saveDB(db)
      return sock.sendMessage(from, { text: AstraText.proposalExpired })
    }

    const proposer = proposal.from

    if (db.marriages[sender] || db.marriages[proposer]) {
      delete db.proposals[sender]
      saveDB(db)
      return sock.sendMessage(from, { text: AstraText.alreadyMarried })
    }

    db.marriages[sender] = proposer
    db.marriages[proposer] = sender
    delete db.proposals[sender]
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.proposalAccepted(proposer),
      mentions: [proposer]
    })
  }
}