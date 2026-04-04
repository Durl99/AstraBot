import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { config } from './config.js'

const execFileAsync = promisify(execFile)

function tempRoot() {
  return config.downloadTempDir || os.tmpdir()
}

function isHttpUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim())
}

function isYouTubeUrl(url = '') {
  return /(?:youtube\.com|youtu\.be)/i.test(String(url))
}

function sanitizeFileName(name = 'astra-media') {
  return String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'astra-media'
}

async function makeTempDir(prefix = 'astrabot-') {
  return fs.mkdtemp(path.join(tempRoot(), prefix))
}

function ytDlpCommandCandidates() {
  const candidates = [[config.ytDlpBin, []]]

  if (config.ytDlpBin === 'yt-dlp') {
    if (process.platform === 'win32') {
      candidates.push(['py', ['-m', 'yt_dlp']])
      candidates.push(['python', ['-m', 'yt_dlp']])
    } else {
      candidates.push(['python3', ['-m', 'yt_dlp']])
      candidates.push(['python', ['-m', 'yt_dlp']])
    }
  }

  return candidates
}

async function runYtDlp(args, options = {}) {
  const baseArgs = ['--ignore-config']

  if (!options.skipCookies && config.ytDlpCookiesFile) {
    baseArgs.push('--cookies', config.ytDlpCookiesFile)
  }

  if (config.ffmpegBin) {
    baseArgs.push('--ffmpeg-location', config.ffmpegBin)
  }

  let lastError = null

  for (const [command, prefixArgs] of ytDlpCommandCandidates()) {
    try {
      return await execFileAsync(command, [...prefixArgs, ...baseArgs, ...args], {
        timeout: config.downloadTimeoutMs,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      })
    } catch (error) {
      lastError = error
      if (error?.code !== 'ENOENT') throw error
    }
  }

  throw lastError || new Error('Could not execute yt-dlp')
}

async function getMediaFile(dir) {
  const files = await fs.readdir(dir)
  const candidates = files
    .filter(file => !file.endsWith('.part') && !file.endsWith('.ytdl'))
    .map(file => path.join(dir, file))

  if (!candidates.length) {
    throw new Error('yt-dlp did not produce a downloadable file')
  }

  const stats = await Promise.all(
    candidates.map(async file => ({
      file,
      stat: await fs.stat(file)
    }))
  )

  stats.sort((a, b) => b.stat.size - a.stat.size)
  return stats[0]
}

export async function fetchMediaInfo(url) {
  const youtube = isYouTubeUrl(url)
  const extraArgs = youtube
    ? ['--extractor-args', 'youtube:player_client=android,ios']
    : []

  const { stdout } = await runYtDlp([
    '--dump-single-json',
    '--no-warnings',
    '--skip-download',
    ...extraArgs,
    url
  ], { skipCookies: youtube })

  return JSON.parse(stdout)
}

export async function resolveYouTubeInput(input) {
  const value = String(input || '').trim()
  if (!value) {
    throw new Error('Missing YouTube input')
  }

  if (isHttpUrl(value)) {
    return {
      query: value,
      url: value,
      title: ''
    }
  }

  const { stdout } = await runYtDlp([
    '--dump-single-json',
    '--no-warnings',
    `ytsearch1:${value}`
  ], { skipCookies: true })

  const json = JSON.parse(stdout)
  const entry = Array.isArray(json?.entries) ? json.entries[0] : json

  if (!entry) {
    throw new Error('No YouTube results found')
  }

  return {
    query: value,
    url: entry.webpage_url || entry.url || `https://youtu.be/${entry.id}`,
    title: entry.title || ''
  }
}

export async function searchYouTubeResults(query, limit = 5) {
  const value = String(query || '').trim()
  if (!value) {
    throw new Error('Missing YouTube search query')
  }

  const { stdout } = await runYtDlp([
    '--dump-single-json',
    '--no-warnings',
    `ytsearch${limit}:${value}`
  ], { skipCookies: true })

  const json = JSON.parse(stdout)
  const entries = Array.isArray(json?.entries) ? json.entries : []

  return entries
    .filter(Boolean)
    .map((entry, index) => ({
      index: index + 1,
      id: entry.id || '',
      title: entry.title || `Resultado ${index + 1}`,
      url: entry.webpage_url || entry.url || `https://youtu.be/${entry.id}`,
      duration: entry.duration || 0,
      channel: entry.channel || entry.uploader || ''
    }))
}

export async function downloadAudio(url) {
  const youtube = isYouTubeUrl(url)
  const info = youtube ? null : await fetchMediaInfo(url)
  const dir = await makeTempDir('astrabot-audio-')
  const template = path.join(dir, '%(title).80s.%(ext)s')

  try {
    await runYtDlp([
      '--no-warnings',
      ...(youtube ? ['--extractor-args', 'youtube:player_client=android,ios'] : []),
      ...(youtube ? ['-f', 'ba/b'] : []),
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--output', template,
      url
    ], { skipCookies: youtube })

    const result = await getMediaFile(dir)
    if (result.stat.size > config.downloadMaxFileBytes) {
      throw new Error('downloaded file exceeds the configured upload limit')
    }

    const baseName = path.basename(result.file, path.extname(result.file))

    return {
      kind: 'audio',
      title: info?.title || baseName || 'Astra audio',
      fileName: `${sanitizeFileName(info?.title || baseName || 'astra-audio')}.mp3`,
      filePath: result.file,
      size: result.stat.size,
      cleanupDir: dir
    }
  } catch (error) {
    await fs.rm(dir, { recursive: true, force: true })
    throw error
  }
}

function videoArgs(url, template) {
  return [
    '--no-warnings',
    '-f', 'mp4/bv*+ba/b',
    '--merge-output-format', 'mp4',
    '--output', template,
    url
  ]
}

function genericArgs(url, template) {
  return [
    '--no-warnings',
    '--output', template,
    url
  ]
}

export async function downloadGeneric(url, preferVideo = true) {
  const youtube = isYouTubeUrl(url)
  const info = youtube ? null : await fetchMediaInfo(url)
  const dir = await makeTempDir('astrabot-media-')
  const template = path.join(dir, '%(title).80s.%(ext)s')
  const primaryArgs = preferVideo
    ? youtube
      ? [
          '--no-warnings',
          '--extractor-args', 'youtube:player_client=android,ios',
          '-f', 'bv*+ba/b',
          '--merge-output-format', 'mp4',
          '--output', template,
          url
        ]
      : videoArgs(url, template)
    : youtube
      ? [
          '--no-warnings',
          '--extractor-args', 'youtube:player_client=android,ios',
          '-f', 'b',
          '--output', template,
          url
        ]
      : genericArgs(url, template)

  try {
    try {
      await runYtDlp(primaryArgs, { skipCookies: youtube })
    } catch (error) {
      if (!preferVideo) throw error
      await runYtDlp(genericArgs(url, template), { skipCookies: youtube })
    }

    const result = await getMediaFile(dir)
    if (result.stat.size > config.downloadMaxFileBytes) {
      throw new Error('downloaded file exceeds the configured upload limit')
    }

    const ext = path.extname(result.file).slice(1).toLowerCase()
    const baseName = path.basename(result.file, path.extname(result.file))
    const mimeKind = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
      ? 'image'
      : ['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)
        ? 'audio'
        : 'video'

    return {
      kind: mimeKind,
      title: info?.title || baseName || 'Astra media',
      fileName: `${sanitizeFileName(info?.title || baseName || 'astra-media')}.${ext || 'bin'}`,
      filePath: result.file,
      size: result.stat.size,
      cleanupDir: dir
    }
  } catch (error) {
    await fs.rm(dir, { recursive: true, force: true })
    throw error
  }
}

export async function readDownloadedFile(filePath) {
  return fs.readFile(filePath)
}

export async function cleanupDownload(dir) {
  if (!dir) return
  await fs.rm(dir, { recursive: true, force: true })
}
