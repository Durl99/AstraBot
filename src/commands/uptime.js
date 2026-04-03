function formatUptime(seconds) {
  const total = Math.floor(seconds)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (s || !parts.length) parts.push(`${s}s`)

  return parts.join(' ')
}

export default {
  name: 'uptime',
  aliases: ['runtime'],
  description: 'Muestra el tiempo activo del núcleo astral',
  category: 'info',
  cooldown: 3,
  async run({ sock, from }) {
    const uptime = formatUptime(process.uptime())

    await sock.sendMessage(from, {
      text: `🛰️ *UPTIME ASTRAL*\n\nAstraBot lleva activo:\n*${uptime}*`
    })
  }
}