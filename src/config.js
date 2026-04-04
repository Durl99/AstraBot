import 'dotenv/config'

export const config = {
  botName: process.env.BOT_NAME || 'AstraBot',
  instanceName: process.env.INSTANCE_NAME || 'local',
  prefix: process.env.PREFIX || '.',
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
  downloadMaxFileBytes: Number(process.env.DOWNLOAD_MAX_FILE_BYTES || 52428800)
}
