import 'dotenv/config'

export const config = {
  botName: process.env.BOT_NAME || 'AstraBot',
  prefix: process.env.PREFIX || '.',
  owner: (process.env.OWNER_NUMBER || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean),
  ownerLid: (process.env.OWNER_LID || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}