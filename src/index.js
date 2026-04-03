import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
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
  const { version } = await fetchLatestBaileysVersion()
  const commands = await loadCommands()

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: [config.botName, 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    printQRInTerminal: false
  })

  sock.downloadMediaMessage = async (msg) => {
    return downloadMediaMessage(msg, 'buffer', {}, {
      logger,
      reuploadRequest: sock.updateMediaMessage
    })
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('📷 QR detectado, pero en hosting se recomienda usar pairing code.')
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

  // Pairing code solo si aún no está registrada la sesión
  if (!sock.authState.creds.registered) {
    const phoneNumber = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '')

    if (!phoneNumber) {
      console.log('⚠️ No hay OWNER_NUMBER configurado para generar pairing code.')
    } else {
      try {
        console.log('📡 Generando código de emparejamiento...')
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`🔑 Código de emparejamiento: ${code}`)
      } catch (e) {
        console.error('❌ No pude generar el pairing code:', e)
      }
    }
  }

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