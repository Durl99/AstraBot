import { fetchWeather } from '../services.js'

const GUIDE = '\u{1F9ED}'
const SATELLITE = '\u{1F6F0}\uFE0F'
const CLOUD = '\u{1F324}\uFE0F'
const PIN = '\u{1F4CD}'
const THERMOMETER = '\u{1F321}\uFE0F'
const BUBBLE = '\u{1FAE7}'
const DROPS = '\u{1F4A7}'
const WIND = '\u{1F32C}\uFE0F'
const EYE = '\u{1F441}\uFE0F'
const SUNRISE = '\u{1F305}'
const SUNSET = '\u{1F307}'
const SPARKLES = '\u2728'
const WARN = '\u26A0\uFE0F'

function buildLocationLine(data) {
  return [data.area, data.region, data.country].filter(Boolean).join(', ')
}

export default {
  name: 'clima',
  aliases: ['weather'],
  description: 'Consulta el clima de una ciudad desde la orbita',
  category: 'tools',
  cooldown: 5,
  async run({ sock, from, args, msg }) {
    const city = args.join(' ').trim()

    if (!city) {
      return sock.sendMessage(from, {
        text:
          `${GUIDE} *USO CORRECTO DE CLIMA*\n\n` +
          'Usa *.clima ciudad* para escanear el ambiente de esa zona.\n\n' +
          'Ejemplos:\n' +
          '- *.clima San Jose*\n' +
          '- *.clima Ciudad de Mexico*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, {
        text: `${SATELLITE} AstraBot esta leyendo la atmosfera de *${city}* desde el radar estelar...`
      }, { quoted: msg })

      const weather = await fetchWeather(city)
      const location = buildLocationLine(weather)

      await sock.sendMessage(from, {
        text:
          `${CLOUD} *REPORTE CLIMATICO ASTRAL*\n\n` +
          `${PIN} Zona: *${location}*\n` +
          `?? Estado: *${weather.description}*\n` +
          `${THERMOMETER} Temperatura: *${weather.temperatureC}C*\n` +
          `${BUBBLE} Sensacion: *${weather.feelsLikeC}C*\n` +
          `${DROPS} Humedad: *${weather.humidity}%*\n` +
          `${WIND} Viento: *${weather.windKmph} km/h*\n` +
          `${EYE} Visibilidad: *${weather.visibilityKm} km*\n` +
          `${weather.sunrise ? `${SUNRISE} Amanecer: *${weather.sunrise}*\n` : ''}` +
          `${weather.sunset ? `${SUNSET} Atardecer: *${weather.sunset}*\n` : ''}` +
          `\n${SPARKLES} AstraBot ya leyo la atmosfera de esa constelacion urbana.`
      }, { quoted: msg })
    } catch (error) {
      console.error('Error clima:', error)
      await sock.sendMessage(from, {
        text: `${WARN} No pude leer el clima de esa zona desde el radar astral.`
      }, { quoted: msg })
    }
  }
}
