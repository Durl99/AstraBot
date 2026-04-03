import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import { loadCommands, handleMessage } from './handler.js'
import { config } from './config.js'
import { loadDB, ensureGroup } from './store.js'

const logger = pino({ level: 'silent' })
const db = loadDB()

async function startBot() {
  const sessionPath = process.env.SESSION_PATH || './src/sessions'
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const commands = await loadCommands()

  const sock = makeWASocket({
    auth: state,
    logger,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000
  })

  sock.downloadMediaMessage = async (msg) => {
    return downloadMediaMessage(msg, 'buffer', {}, {
      logger,
      reuploadRequest: sock.updateMediaMessage
    })
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (connection === 'connecting') {
      console.log('🛰️ AstraBot está iniciando conexión...')
    }

    if (qr) {
      console.log('📷 Escanea este QR para vincular AstraBot:')
      try {
        qrcode.generate(qr, { small: true })
      } catch (e) {
        console.log('No pude renderizar el QR en consola.')
      }
    }

    if (connection === 'open') {
      console.log(`✅ ${config.botName} conectado`)
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('Conexión cerrada:', statusCode, 'Reconectar:', shouldReconnect)

      if (shouldReconnect) {
        startBot()
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg?.message) return
    if (msg.key.fromMe) return
    if (msg.key.remoteJid === 'status@broadcast') return

    await handleMessage({ sock, msg, commands, db })
  })

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    const group = ensureGroup(db, id)
    const metadata = await sock.groupMetadata(id)

    if (action === 'add' && group.welcome) {
      for (const user of participants) {
        const text = group.welcomeText
          .replace(/@user/g, `@${user.split('@')[0]}`)
          .replace(/@group/g, metadata.subject || config.botName)

        await sock.sendMessage(id, {
          text,
          mentions: [user]
        })
      }
    }

    if (action === 'remove') {
      for (const user of participants) {
        const text = group.byeText
          .replace(/@user/g, `@${user.split('@')[0]}`)
          .replace(/@group/g, metadata.subject || config.botName)

        await sock.sendMessage(id, {
          text,
          mentions: [user]
        })
      }
    }
  })
}

startBot()