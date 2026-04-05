// api/send.js — Vercel Serverless Function (CommonJS)
// Recebe o PDF do portal e envia para o Gmail monitorado pelo Make
// Variáveis de ambiente no Vercel:
//   EMAIL_FROM = remetente (quem envia)
//   EMAIL_TO   = destino (Gmail monitorado pelo Make)
//   EMAIL_PASS = App Password do Gmail (sem espaços)

const nodemailer = require('nodemailer')

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    // Lê body bruto (multipart/form-data)
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

    // Extrai boundary
    const ct = req.headers['content-type'] || ''
    const bMatch = ct.match(/boundary=(.+)/)
    if (!bMatch) return res.status(400).json({ error: 'Boundary não encontrado' })
    const boundary = bMatch[1].trim()

    // Parseia multipart manualmente
    const boundaryBuf = Buffer.from('--' + boundary)
    let fileBuffer = null
    let fileName = 'documento.pdf'
    let start = 0

    while (start < rawBody.length) {
      const bIdx = rawBody.indexOf(boundaryBuf, start)
      if (bIdx === -1) break
      const hStart = bIdx + boundaryBuf.length + 2
      const hEnd = rawBody.indexOf(Buffer.from('\r\n\r\n'), hStart)
      if (hEnd === -1) break
      const headers = rawBody.slice(hStart, hEnd).toString()
      const dStart = hEnd + 4
      const nextB = rawBody.indexOf(boundaryBuf, dStart)
      const dEnd = nextB === -1 ? rawBody.length : nextB - 2

      const fnMatch = headers.match(/filename="([^"]+)"/)
      const nameMatch = headers.match(/name="([^"]+)"/)
      if (nameMatch && nameMatch[1] === 'arquivo' && fnMatch) {
        fileBuffer = rawBody.slice(dStart, dEnd)
        fileName = fnMatch[1]
      }
      start = nextB === -1 ? rawBody.length : nextB
    }

    if (!fileBuffer) return res.status(400).json({ error: 'Arquivo não encontrado no upload' })

    // Configura transporte Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Envia e-mail com o arquivo anexado
    await transporter.sendMail({
      from: `"Portal Raízes VM" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: `[Raízes VM] Documento para comunicado — ${fileName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#3D4F3C;padding:24px;border-radius:12px 12px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">📋 Raízes Vila Matilde</h2>
            <p style="color:rgba(255,255,255,.6);margin:6px 0 0;font-size:13px">Portal do Síndico · Automação IA</p>
          </div>
          <div style="background:#f9f7f3;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0d8cc">
            <p style="color:#333;font-size:14px;margin:0 0 16px">
              Novo documento enviado pelo portal para processamento.
            </p>
            <table style="width:100%;font-size:13px;color:#666;border-collapse:collapse">
              <tr><td style="padding:6px 0;font-weight:700;color:#3D4F3C;width:130px">Arquivo:</td><td>${fileName}</td></tr>
              <tr><td style="padding:6px 0;font-weight:700;color:#3D4F3C">Enviado em:</td><td>${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td></tr>
              <tr><td style="padding:6px 0;font-weight:700;color:#3D4F3C">Origem:</td><td>Portal Raízes VM</td></tr>
            </table>
            <p style="color:#aaa;font-size:11px;margin:20px 0 0">Gerado automaticamente · Raízes Vila Matilde</p>
          </div>
        </div>
      `,
      attachments: [{ filename: fileName, content: fileBuffer }],
    })

    console.log(`✅ Enviado: ${fileName} → ${process.env.EMAIL_TO}`)
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('❌ Erro:', err)
    return res.status(500).json({
      error: 'Falha ao enviar',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
