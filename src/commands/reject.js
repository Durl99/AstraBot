import { saveDB } from '../store.js'
import { AstraText } from '../astramessages.js'

export default {
  name: 'reject',
  aliases: ['rechazar'],
  description: 'Rechaza una propuesta astral pendiente',
  category: 'fun',
  cooldown: 3,
  async run({ sock, from, sender, db }) {
    const proposal = db.proposals[sender]

    if (!proposal) {
      return sock.sendMessage(from, { text: AstraText.noProposal })
    }

    const proposer = proposal.from
    delete db.proposals[sender]
    saveDB(db)

    await sock.sendMessage(from, {
      text: AstraText.proposalRejected(proposer),
      mentions: [proposer]
    })
  }
}