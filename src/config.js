import 'dotenv/config'

export const config = {
  botName: process.env.BOT_NAME || 'AstraBot',
  instanceName: process.env.INSTANCE_NAME || 'local',
  prefix: process.env.PREFIX || '.',
  hostCity: process.env.HOST_CITY || 'San Jose',
  hostRegion: process.env.HOST_REGION || 'San Jose',
  hostCountry: process.env.HOST_COUNTRY || 'Costa Rica',
  hostTimezone: process.env.HOST_TIMEZONE || process.env.TZ || 'America/Costa_Rica',
  weatherLocation: process.env.WEATHER_LOCATION || process.env.HOST_CITY || 'San Jose, Costa Rica',
  owner: (process.env.OWNER_NUMBER || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean),
  ownerLid: (process.env.OWNER_LID || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean),
  ytDlpBin: process.env.YTDLP_BIN || 'yt-dlp',
  ffmpegBin: process.env.FFMPEG_BIN || 'ffmpeg',
  ytDlpCookiesFile: process.env.YTDLP_COOKIES_FILE || '',
  downloadTempDir: process.env.DOWNLOAD_TEMP_DIR || '',
  downloadTimeoutMs: Number(process.env.DOWNLOAD_TIMEOUT_MS || 180000),
  downloadMaxFileBytes: Number(process.env.DOWNLOAD_MAX_FILE_BYTES || 52428800),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 45000)
}
