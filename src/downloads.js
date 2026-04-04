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

async function runYtDlp(args) {
  const baseArgs = []

  if (config.ytDlpCookiesFile) {
    baseArgs.push('--cookies', config.ytDlpCookiesFile)
  }

  if (config.ffmpegBin) {
    baseArgs.push('--ffmpeg-location', config.ffmpegBin)
  }

  return execFileAsync(config.ytDlpBin, [...baseArgs, ...args], {
    timeout: config.downloadTimeoutMs,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  })
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
  const { stdout } = await runYtDlp([
    '--dump-single-json',
    '--no-warnings',
    '--skip-download',
    url
  ])

  return JSON.parse(stdout)
}

export async function downloadAudio(url) {
  const info = await fetchMediaInfo(url)
  const dir = await makeTempDir('astrabot-audio-')
  const template = path.join(dir, '%(title).80s.%(ext)s')

  try {
    await runYtDlp([
      '--no-warnings',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--output', template,
      url
    ])

    const result = await getMediaFile(dir)
    if (result.stat.size > config.downloadMaxFileBytes) {
      throw new Error('downloaded file exceeds the configured upload limit')
    }

    return {
      kind: 'audio',
      title: info.title || 'Astra audio',
      fileName: `${sanitizeFileName(info.title || 'astra-audio')}.mp3`,
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
  const info = await fetchMediaInfo(url)
  const dir = await makeTempDir('astrabot-media-')
  const template = path.join(dir, '%(title).80s.%(ext)s')

  try {
    try {
      await runYtDlp(preferVideo ? videoArgs(url, template) : genericArgs(url, template))
    } catch (error) {
      if (!preferVideo) throw error
      await runYtDlp(genericArgs(url, template))
    }

    const result = await getMediaFile(dir)
    if (result.stat.size > config.downloadMaxFileBytes) {
      throw new Error('downloaded file exceeds the configured upload limit')
    }

    const ext = path.extname(result.file).slice(1).toLowerCase()
    const mimeKind = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
      ? 'image'
      : ['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)
        ? 'audio'
        : 'video'

    return {
      kind: mimeKind,
      title: info.title || 'Astra media',
      fileName: `${sanitizeFileName(info.title || 'astra-media')}.${ext || 'bin'}`,
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
