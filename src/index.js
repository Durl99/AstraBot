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
import { handleDeletedMessage, rememberMessage } from './antidelete.js'
import { config } from './config.js'
import { loadDB, saveDB } from './store.js'
import { handleGroupParticipantsUpdate } from './groupwelcome.js'

const logger = pino({ level: 'silent' })

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

let latestQR = null
let qrImageDataUrl = null
let botStatus = 'starting'

let currentSock = null
let starting = false
let reconnectTimer = null
let saveInterval = null

const db = loadDB()
const commandsPromise = loadCommands()

function getDisconnectReasonName(statusCode) {
  const reasonName = Object.entries(DisconnectReason).find(([, value]) => value === statusCode)?.[0]
  return reasonName || 'unknown'
}

function getDisconnectExplanation(statusCode) {
  switch (statusCode) {
    case DisconnectReason.connectionReplaced:
      return 'Otra instancia tomo esta sesion.'
    case DisconnectReason.loggedOut:
      return 'La sesion fue cerrada y necesita nueva vinculacion.'
    case DisconnectReason.connectionClosed:
      return 'La conexion se cerro de forma inesperada.'
    case DisconnectReason.connectionLost:
      return 'La conexion con WhatsApp se perdio.'
    case DisconnectReason.timedOut:
      return 'La conexion expiro por tiempo.'
    case DisconnectReason.badSession:
      return 'La sesion guardada parece invalida.'
    case DisconnectReason.restartRequired:
      return 'WhatsApp pidio reiniciar la conexion.'
    case DisconnectReason.multideviceMismatch:
      return 'La cuenta no coincide con el modo multidispositivo esperado.'
    case DisconnectReason.forbidden:
      return 'WhatsApp rechazo la conexion.'
    case DisconnectReason.unavailableService:
      return 'El servicio de WhatsApp no estaba disponible.'
    default:
      return 'Motivo no identificado por Baileys.'
  }
}

function getDisconnectAction(statusCode, shouldReconnect) {
  if (statusCode === DisconnectReason.connectionReplaced) {
    return 'Cierra la otra instancia de AstraBot si quieres usar esta.'
  }

  if (statusCode === DisconnectReason.loggedOut) {
    return 'Borra src/sessions y vuelve a vincular el bot.'
  }

  if (shouldReconnect) {
    return 'AstraBot intentara reconectar automaticamente.'
  }

  return 'Revisa la sesion y el estado de la conexion.'
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function scheduleReconnect(delayMs = 3000) {
  if (reconnectTimer) return

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    startBot().catch(err => {
      console.error('Error reiniciando AstraBot:', err)
      scheduleReconnect(5000)
    })
  }, delayMs)
}

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
            <p>La señal astral esta estable.</p>
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
            <div class="warn">Esta pagina solo deberia usarse temporalmente mientras vinculas el bot.</div>
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
          <p>Generando QR o esperando conexion...</p>
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

app.listen(PORT, HOST, () => {
  console.log(`Web temporal activa en ${HOST}:${PORT} | instancia=${config.instanceName} | host=${process.env.HOSTNAME || process.env.COMPUTERNAME || 'desconocido'} | pid=${process.pid}`)
})

async function startBot() {
  if (starting) return
  starting = true
  clearReconnectTimer()

  try {
    if (currentSock) {
      try {
        currentSock.ev.removeAllListeners('connection.update')
        currentSock.ev.removeAllListeners('messages.upsert')
        currentSock.ev.removeAllListeners('group-participants.update')
        currentSock.ev.removeAllListeners('creds.update')
        currentSock.end?.(undefined)
      } catch {
        // Ignoro errores de cierre en sockets viejos.
      }
      currentSock = null
    }

    const { state, saveCreds } = await useMultiFileAuthState('./src/sessions')
    const { version } = await fetchLatestBaileysVersion()
    const commands = await commandsPromise

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['AstraBot', 'Chrome', '1.0.0']
    })

    currentSock = sock

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      if (sock !== currentSock) return

      const { connection, lastDisconnect, qr } = update

      if (qr) {
        latestQR = qr
        qrImageDataUrl = await QRCode.toDataURL(qr, {
          width: 320,
          margin: 2
        })
        botStatus = 'qr'
        console.log('📱 QR generado. Abrelo desde la web del servicio.')
      }

      if (connection === 'open') {
        botStatus = 'connected'
        latestQR = null
        qrImageDataUrl = null
        clearReconnectTimer()
        console.log('✅ AstraBot conectado')
      }

      if (connection === 'close') {
        botStatus = 'disconnected'

        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode
            : undefined

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut &&
          statusCode !== DisconnectReason.connectionReplaced

        const reasonName = getDisconnectReasonName(statusCode)
        const explanation = getDisconnectExplanation(statusCode)
        const action = getDisconnectAction(statusCode, shouldReconnect)

        console.log(
          `❌ Conexion cerrada | codigo=${statusCode ?? 'unknown'} | motivo=${reasonName} | reconectar=${shouldReconnect}`
        )
        console.log(`🧭 Causa: ${explanation}`)
        console.log(`🛠️ Accion: ${action}`)

        if (statusCode === DisconnectReason.connectionReplaced) {
          currentSock = null
        } else if (shouldReconnect) {
          currentSock = null
          scheduleReconnect(statusCode === 440 ? 5000 : 3000)
        } else {
          console.log('🚫 Sesion cerrada. Borra src/sessions y vuelve a vincular.')
        }
      }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (sock !== currentSock) return
      if (type !== 'notify') return

      const msg = messages[0]
      if (!msg?.message) return
      if (msg.key?.remoteJid === 'status@broadcast') return

      rememberMessage(msg)

      if (msg.message?.protocolMessage?.key) {
        try {
          await handleDeletedMessage({ sock, msg, db })
        } catch (err) {
          console.error('Error manejando antidelete:', err)
        }
      }

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
      if (sock !== currentSock) return

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

    if (!saveInterval) {
      saveInterval = setInterval(() => {
        saveDB(db)
      }, 30000)
    }
  } finally {
    starting = false
  }
}

startBot().catch(err => {
  console.error('Error iniciando AstraBot:', err)
  scheduleReconnect(5000)
})


