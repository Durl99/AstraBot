export default {
  name: 'ping',
  aliases: ['p'],
  description: 'Verifica la señal astral',
  category: 'main',
  cooldown: 2,
  async run({ sock, from, config }) {
    await sock.sendMessage(from, {
      text:
        '🪐 Pong. Señal astral estable.\n' +
        `🧭 Instancia: *${config.instanceName}*\n` +
        `🖥️ Host: *${process.env.HOSTNAME || process.env.COMPUTERNAME || 'desconocido'}*\n` +
        `🧬 PID: *${process.pid}*`
    })
  }
}
