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

const pairingNumber = (process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, '')

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

  let pairingCodeRequested = false

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    try {
      const notRegistered =
        !!pairingNumber &&
        !sock.authState?.creds?.registered &&
        !pairingCodeRequested

      if (notRegistered) {
        pairingCodeRequested = true
        const code = await sock.requestPairingCode(pairingNumber)
        console.log(`🔑 Pairing code AstraBot: ${code}`)
        console.log('📱 En tu WhatsApp ve a Dispositivos vinculados > Vincular con número de teléfono')
      } else if (qr && !pairingNumber) {
        console.log('\n📱 Escanea este QR:\n')
        qrcode.generate(qr, { small: true })
      }
    } catch (err) {
      console.error('Error solicitando pairing code:', err)
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
        console.log('🚫 Sesión cerrada. Borra sessions y vuelve a vincular.')
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

  setInterval(() => {
    saveDB(db)
  }, 30000)
}

startBot()