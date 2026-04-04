import fs from 'fs'
import path from 'path'
import { ensureGroup } from './store.js'

const WELCOME_IMAGE_PATH = path.resolve('src/assets/welcome-astrabot.png')
const BYE_IMAGE_PATH = path.resolve('src/assets/welcome-astrabot.png')

function formatGroupText(template, userJid, groupName) {
  return String(template || '')
    .replaceAll('@user', `@${String(userJid).split('@')[0]}`)
    .replaceAll('@group', groupName || 'esta orbita')
}

async function sendWelcomeCard(sock, groupId, participant, groupName, template) {
  const imageBuffer = fs.readFileSync(WELCOME_IMAGE_PATH)
  const caption = formatGroupText(template, participant, groupName)

  await sock.sendMessage(groupId, {
    image: imageBuffer,
    caption,
    mentions: [participant]
  })
}

async function sendByeCard(sock, groupId, participant, groupName, template) {
  const imageBuffer = fs.readFileSync(BYE_IMAGE_PATH)
  const caption = formatGroupText(template, participant, groupName)

  await sock.sendMessage(groupId, {
    image: imageBuffer,
    caption,
    mentions: [participant]
  })
}

export async function sendWelcomePreview({ sock, groupId, participant, groupName, template }) {
  await sendWelcomeCard(sock, groupId, participant, groupName, template)
}

export async function sendByePreview({ sock, groupId, participant, groupName, template }) {
  await sendByeCard(sock, groupId, participant, groupName, template)
}

export async function handleGroupParticipantsUpdate({ sock, update, db }) {
  const { id, participants = [], action } = update
  if (!id || !participants.length) return

  const group = ensureGroup(db, id)
  const metadata = await sock.groupMetadata(id).catch(() => null)
  const groupName = metadata?.subject || 'esta orbita'

  if (action === 'add' && group.welcome) {
    for (const participant of participants) {
      await sendWelcomeCard(sock, id, participant, groupName, group.welcomeText)
    }
  }

  if (action === 'remove' && group.bye) {
    for (const participant of participants) {
      await sendByeCard(sock, id, participant, groupName, group.byeText)
    }
  }
}
