import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import { Boom } from '@hapi/boom'
import express from 'express'
import QRCode from 'qrcode'

import { loadCommands, handleMessage } from './handler.js'
import { loadDB, saveDB } from './store.js'
import { handleGroupParticipantsUpdate } from './groupwelcome.js'

const logger = pino({ level: 'silent' })

const app = express()
const PORT = process.env.PORT || 3000

let latestQR = null
let qrImageDataUrl = null
let botStatus = 'starting'

app.get('/', async (req, res) => {
  try {
    if (botStatus === 'connected') {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>AstraBot</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #0b1020;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              background: #11182d;
              padding: 32px;
              border-radius: 18px;
              text-align: center;
              max-width: 420px;
              box-shadow: 0 10px 30px rgba(0,0,0,.35);
            }
            h1 { margin-top: 0; }
            p { opacity: .9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🚀 AstraBot conectado</h1>
            <p>La señal astral está estable.</p>
          </div>
        </body>
        </html>
      `)
    }

    if (!qrImageDataUrl && latestQR) {
      qrImageDataUrl = await QRCode.toDataURL(latestQR, {
        width: 320,
        margin: 2
      })
    }

    if (qrImageDataUrl) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>AstraBot QR</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #050814;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              background: #0f1730;
              padding: 28px;
              border-radius: 20px;
              text-align: center;
              max-width: 420px;
              box-shadow: 0 10px 35px rgba(0,0,0,.45);
            }
            h1 {
              margin: 0 0 10px;
              font-size: 28px;
            }
            p {
              margin: 0 0 18px;
              opacity: .9;
            }
            img {
              width: 320px;
              max-width: 100%;
              border-radius: 12px;
              background: white;
              padding: 10px;
            }
            .warn {
              margin-top: 14px;
              font-size: 13px;
              opacity: .8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🪐 AstraBot QR</h1>
            <p>Escanea este QR con el WhatsApp del bot.</p>
            <img src="${qrImageDataUrl}" alt="QR AstraBot" />
            <div class="warn">Esta página solo debería usarse temporalmente mientras vinculas el bot.</div>
          </div>
        </body>
        </html>
      `)
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AstraBot</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #0b1020;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: #11182d;
            padding: 32px;
            border-radius: 18px;
            text-align: center;
            max-width: 420px;
            box-shadow: 0 10px 30px rgba(0,0,0,.35);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌌 AstraBot</h1>
          <p>Generando QR o esperando conexión...</p>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    res.status(500).send(`Error mostrando QR: ${error.message}`)
  }
})

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: botStatus,
    hasQR: !!latestQR
  })
})

app.listen(PORT, () => {
  console.log(`🌐 Web temporal activa en puerto ${PORT}`)
})

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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      latestQR = qr
      qrImageDataUrl = await QRCode.toDataURL(qr, {
        width: 320,
        margin: 2
      })
      botStatus = 'qr'
      console.log('📱 QR generado. Ábrelo desde la web del servicio.')
    }

    if (connection === 'open') {
      botStatus = 'connected'
      latestQR = null
      qrImageDataUrl = null
      console.log('✅ AstraBot conectado')
    }

    if (connection === 'close') {
      botStatus = 'disconnected'

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

  sock.ev.on('group-participants.update', async (update) => {
    try {
      await handleGroupParticipantsUpdate({
        sock,
        update,
        db
      })
    } catch (err) {
      console.error('Error manejando bienvenida/despedida:', err)
    }
  })

  setInterval(() => {
    saveDB(db)
  }, 30000)
}

startBot()
