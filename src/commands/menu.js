import fs from 'fs'
import path from 'path'
import { AstraText } from '../astramessages.js'
import { fetchWeather } from '../services.js'

const MENU_IMAGE_PATH = path.resolve('src/assets/menu-astrabot.png')

const ROCKET = '\u{1F680}'
const SATELLITE = '\u{1F6F0}\uFE0F'
const TOOLBOX = '\u{1F9F0}'
const GALAXY = '\u{1F30C}'
const SHIELD = '\u{1F6E1}\uFE0F'
const MEDIA = '\u{1FAA0}'
const GAMEPAD = '\u{1F3AE}'
const CROWN = '\u{1F451}'
const SPARKLES = '\u2728'
const OWNER = '\u{1F451}'
const ADMIN = '\u{1F6E1}\uFE0F'
const GROUP = '\u{1F465}'
const PRIVATE = '\u{1F4E9}'
const CLOCK = '\u{1F550}'
const PIN = '\u{1F4CD}'
const CLOUD = '\u2601\uFE0F'
const MOON = '\u{1F319}'

function formatHostTime(timezone) {
  const now = new Date()

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now)

  const date = new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(now)

  return { time, date }
}

function buildHostLabel(config) {
  return [config.hostCity, config.hostRegion, config.hostCountry]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
}

function formatWeatherSummary(weather) {
  const place = [weather.area, weather.region, weather.country].filter(Boolean).join(', ')
  return [
    `${CLOUD} Clima host: *${weather.description}*`,
    `Temperatura: *${weather.temperatureC}C* | Sensacion: *${weather.feelsLikeC}C*`,
    `Humedad: *${weather.humidity}%* | Viento: *${weather.windKmph} km/h*`,
    place ? `Zona detectada: *${place}*` : null
  ].filter(Boolean)
}

export default {
  name: 'menu',
  aliases: ['help', 'menua'],
  description: 'Despliega el nucleo de comandos astrales',
  category: 'main',
  cooldown: 3,
  async run({ sock, from, commands, config }) {
    const categoryOrder = ['main', 'info', 'tools', 'group', 'moderation', 'media', 'fun', 'owner']

    const categoryMeta = {
      main: { emoji: ROCKET, title: 'NUCLEO PRINCIPAL' },
      info: { emoji: SATELLITE, title: 'INFORMACION ASTRAL' },
      tools: { emoji: TOOLBOX, title: 'HERRAMIENTAS COSMICAS' },
      group: { emoji: GALAXY, title: 'GESTION DE ORBITA' },
      moderation: { emoji: SHIELD, title: 'MODERACION ESTELAR' },
      media: { emoji: MEDIA, title: 'MEDIA Y RELIQUIAS' },
      fun: { emoji: GAMEPAD, title: 'DIVERSION GALACTICA' },
      owner: { emoji: CROWN, title: 'NUCLEO DE MANDO' },
      otros: { emoji: SPARKLES, title: 'OTROS MODULOS' }
    }

    const grouped = {}
    for (const cmd of commands) {
      const cat = cmd.category || 'otros'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(cmd)
    }

    const sortedCategories = [
      ...categoryOrder.filter(cat => grouped[cat]),
      ...Object.keys(grouped).filter(cat => !categoryOrder.includes(cat))
    ]

    const hostLabel = buildHostLabel(config)
    const hostTime = formatHostTime(config.hostTimezone)

    let weatherLines = [`${CLOUD} Clima host: *senal atmosferica no disponible ahora mismo*`]
    try {
      const weather = await fetchWeather(config.weatherLocation)
      weatherLines = formatWeatherSummary(weather)
    } catch {}

    const headerLines = [
      `${GALAXY} *ASTRA ORBIT CONTROL*`,
      '',
      `${PIN} Host: *${hostLabel || 'Ubicacion astral no configurada'}*`,
      `${CLOCK} Hora local del host: *${hostTime.time}*`,
      `${MOON} Fecha local del host: *${hostTime.date}*`,
      `Zona horaria: *${config.hostTimezone}*`,
      ...weatherLines,
      '',
      `Comandos activos: *${commands.length}*`,
      `Prefijo: *${config.prefix}*`
    ]

    const lines = [...headerLines, '', ...AstraText.menuIntro(config.botName, config.prefix, commands.length), '']

    for (const cat of sortedCategories) {
      const meta = categoryMeta[cat] || categoryMeta.otros
      const cmds = grouped[cat].sort((a, b) => a.name.localeCompare(b.name))

      lines.push(`${meta.emoji} *${meta.title}*`)
      lines.push('────────────────────')

      for (const c of cmds) {
        const flags = [
          c.ownerOnly ? OWNER : null,
          c.adminOnly ? ADMIN : null,
          c.groupOnly ? GROUP : null,
          c.privateOnly ? PRIVATE : null
        ].filter(Boolean).join(' ')

        lines.push(`✦ *${config.prefix}${c.name}* - ${c.description || 'sin descripcion'}${flags ? ` ${flags}` : ''}`)
      }

      lines.push('')
    }

    lines.push(`${MOON} *AstraBot domina la orbita.*`)

    const caption = lines.join('\n')
    const image = fs.readFileSync(MENU_IMAGE_PATH)

    await sock.sendMessage(from, {
      image,
      caption
    })
  }
}
