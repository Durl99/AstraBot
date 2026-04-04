const DEFAULT_UPLOAD_SERVICES = [
  { name: '0x0', type: 'multipart', url: 'https://0x0.st', fileField: 'file' },
  { name: 'catbox', type: 'catbox', url: 'https://catbox.moe/user/api.php' }
]
const DEFAULT_WEATHER_URL = 'https://wttr.in'

function encodeCity(city = '') {
  return encodeURIComponent(city.trim())
}

function isValidHttpUrl(value = '') {
  return /^https?:\/\//i.test(value.trim())
}

async function uploadMultipart(url, fileField, buffer, filename) {
  const form = new FormData()
  const blob = new Blob([buffer])
  form.append(fileField, blob, filename)

  const response = await fetch(url, {
    method: 'POST',
    body: form
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const uploadedUrl = (await response.text()).trim()
  if (!isValidHttpUrl(uploadedUrl)) {
    throw new Error('Upload service did not return a valid URL')
  }

  return uploadedUrl
}

async function uploadCatbox(url, buffer, filename) {
  const form = new FormData()
  const blob = new Blob([buffer])
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', blob, filename)

  const response = await fetch(url, {
    method: 'POST',
    body: form
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const uploadedUrl = (await response.text()).trim()
  if (!isValidHttpUrl(uploadedUrl)) {
    throw new Error('Upload service did not return a valid URL')
  }

  return uploadedUrl
}

export async function uploadBufferToUrl(buffer, filename = 'astrabot-file.bin') {
  const errors = []

  for (const service of DEFAULT_UPLOAD_SERVICES) {
    try {
      if (service.type === 'catbox') {
        return await uploadCatbox(service.url, buffer, filename)
      }

      return await uploadMultipart(service.url, service.fileField, buffer, filename)
    } catch (error) {
      errors.push(`${service.name}: ${error.message}`)
    }
  }

  throw new Error(`All upload services failed. ${errors.join(' | ')}`)
}

export async function fetchWeather(city) {
  const target = encodeCity(city)
  const response = await fetch(`${DEFAULT_WEATHER_URL}/${target}?format=j1`)

  if (!response.ok) {
    throw new Error(`Weather fetch failed with status ${response.status}`)
  }

  const data = await response.json()
  const current = data?.current_condition?.[0]

  if (!current) {
    throw new Error('Weather service returned no current conditions')
  }

  const nearest = data?.nearest_area?.[0]
  const astronomy = data?.weather?.[0]?.astronomy?.[0]

  return {
    area: nearest?.areaName?.[0]?.value || city,
    region: nearest?.region?.[0]?.value || '',
    country: nearest?.country?.[0]?.value || '',
    temperatureC: current.temp_C,
    feelsLikeC: current.FeelsLikeC,
    humidity: current.humidity,
    windKmph: current.windspeedKmph,
    description: current.weatherDesc?.[0]?.value || 'Sin lectura astral',
    visibilityKm: current.visibility,
    sunrise: astronomy?.sunrise || '',
    sunset: astronomy?.sunset || ''
  }
}
