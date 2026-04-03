import crypto from 'crypto'
import { getTargetUser } from './utils.js'

export function resolveTarget(msg, sender) {
  const target = getTargetUser(msg)
  if (!target || target === sender) return null
  return target
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pairPercent(a, b, salt = 'astrabot') {
  const base = [a, b].sort().join('|') + `|${salt}`
  const hash = crypto.createHash('sha256').update(base).digest('hex')
  const num = parseInt(hash.slice(0, 8), 16)
  return num % 101
}