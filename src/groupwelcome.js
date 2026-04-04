import fs from 'fs'
import path from 'path'
import { ensureGroup } from './store.js'

const WELCOME_IMAGE_PATH = path.resolve('src/assets/welcome-astrabot.png')

function formatGroupText(template, userJid, groupName) {
  return String(template || '')
    .replaceAll('@user', `@${String(userJid).split('@')[0]}`)
    .replaceAll('@group', groupName || 'esta orbita')
}

export async function handleGroupParticipantsUpdate({ sock, update, db }) {
  const { id, participants = [], action } = update
  if (!id || !participants.length) return

  const group = ensureGroup(db, id)
  const metadata = await sock.groupMetadata(id).catch(() => null)
  const groupName = metadata?.subject || 'esta orbita'

  if (action === 'add' && group.welcome) {
    const imageBuffer = fs.readFileSync(WELCOME_IMAGE_PATH)

    for (const participant of participants) {
      const caption = formatGroupText(group.welcomeText, participant, groupName)
      await sock.sendMessage(id, {
        image: imageBuffer,
        caption,
        mentions: [participant]
      })
    }
  }

  if (action === 'remove') {
    for (const participant of participants) {
      const text = formatGroupText(group.byeText, participant, groupName)
      await sock.sendMessage(id, {
        text,
        mentions: [participant]
      })
    }
  }
}
