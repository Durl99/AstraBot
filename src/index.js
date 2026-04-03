import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'

import { loadCommands, handleMessage } from './handler.js'
import { loadDB, saveDB } from './store.js'

const logger = pino({ level: 'silent' })

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./src/sessions')

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['AstraBot', 'Chrome', '1.0.0']
  })

  const db = loadDB()
  const commands = await loadCommands()

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Escanea este QR:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true)

      console.log('❌ Conexión cerrada. Reintentando...', shouldReconnect)

      if (shouldReconnect) {
        startBot()
      } else {
        console.log('🚫 Sesión cerrada. Borra sessions y vuelve a escanear.')
      }
    }

    if (connection === 'open') {
      console.log('✅ AstraBot conectado')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg.message) return
    if (msg.key && msg.key.remoteJid === 'status@broadcast') return

    try {
      await handleMessage({
        sock,
        msg,
        commands,
        db
      })
    } catch (err) {
      console.error('Error manejando mensaje:', err)
    }
  })

  // guardado automático cada 30s
  setInterval(() => {
    saveDB(db)
  }, 30000)
}

startBot()