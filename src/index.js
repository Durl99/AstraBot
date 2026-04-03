import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import express from 'express'

import { loadCommands, handleMessage } from './handler.js'
import { loadDB, saveDB } from './store.js'

const logger = pino({ level: 'silent' })

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.status(200).send('AstraBot online 🚀')
})

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    bot: 'AstraBot',
    uptime: process.uptime()
  })
})

app.listen(PORT, () => {
  console.log(`🌐 HTTP server activo en puerto ${PORT}`)
})

const startBot = async () => {
  const sessionPath = './src/sessions'
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
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
      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : undefined

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log('❌ Conexión cerrada. Código:', statusCode, 'Reconectar:', shouldReconnect)

      if (shouldReconnect) {
        startBot()
      } else {
        console.log('🚫 Sesión cerrada. Borra src/sessions y vuelve a vincular.')
      }
    }

    if (connection === 'open') {
      console.log('✅ AstraBot conectado')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg?.message) return
    if (msg.key?.remoteJid === 'status@broadcast') return

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

  setInterval(() => {
    saveDB(db)
  }, 30000)
}

startBot()