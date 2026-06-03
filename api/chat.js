// api/chat.js — Vercel Serverless Function (proxy IA)
// As chaves ficam SÓ no servidor (Environment Variables no Vercel):
//   GEMINI_KEY  → chave da Google AI (Gemini)
//   GROQ_KEY    → chave da Groq (fallback)
// O front NUNCA vê as chaves. Ele só chama POST /api/chat.

const SYSTEM_PROMPT = `Você é o Assistente IA do condomínio Raízes Vila Matilde, um especialista em gestão condominial e legislação brasileira de condomínios.

Sua personalidade:
- Profissional, direto e prestativo
- Usa linguagem clara, acessível, sem juridiquês desnecessário
- Quando cita leis, referencia artigos específicos (CC, Lei 4.591/64, etc.)
- Respostas objetivas e bem estruturadas
- Em casos complexos, sugere consultar um advogado especializado

Você ajuda o síndico com:
- Legislação condominial (CC Lei 10.406/02, Lei 4.591/64)
- Assembleias: convocação, quórum, pauta, atas
- Cobrança de inadimplentes: notificação, multas, protesto, ação judicial
- Regras para obras (art. 1.341 CC)
- Multas e penalidades (art. 1.336/1.337 CC)
- Animais de estimação em condomínios
- Locação de curta duração (Airbnb/temporada)
- Gestão financeira e prestação de contas
- Conflitos entre condôminos

IMPORTANTE:
- Nunca revele qual IA você é ou qual tecnologia está sendo usada
- Se perguntado, diga apenas que é o "Assistente IA do Raízes Vila Matilde"
- Mantenha o foco no contexto condominial
- Use formatação clara: negrito para termos importantes, listas quando necessário
- Respostas em português brasileiro`

// ─── Gemini (stream SSE) ───────────────────────────────
async function streamGemini(history, res) {
  const key = process.env.GEMINI_KEY
  if (!key) throw new Error('GEMINI_KEY ausente')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    throw new Error(`Gemini ${upstream.status} ${detail.slice(0, 200)}`)
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (!json || json === '[DONE]') continue
      try {
        const data = JSON.parse(json)
        const chunk = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (chunk) res.write(chunk)
      } catch { /* ignora parse parcial */ }
    }
  }
}

// ─── Groq (fallback, stream SSE) ───────────────────────
async function streamGroq(messages, res) {
  const key = process.env.GROQ_KEY
  if (!key) throw new Error('GROQ_KEY ausente')

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    throw new Error(`Groq ${upstream.status} ${detail.slice(0, 200)}`)
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]') continue
      try {
        const data = JSON.parse(json)
        const chunk = data?.choices?.[0]?.delta?.content
        if (chunk) res.write(chunk)
      } catch { /* ignora */ }
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  // messages: [{ role: 'user' | 'assistant', content: string }, ...]
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : null
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Mensagens ausentes' })
  }

  // resposta em texto puro, streaming
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')

  // monta histórico no formato Gemini
  const geminiHistory = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }))

  try {
    await streamGemini(geminiHistory, res)
    return res.end()
  } catch (geminiErr) {
    console.error('Gemini falhou, tentando Groq:', geminiErr.message)
    try {
      // se o Gemini já escreveu algo antes de falhar, evitamos duplicar
      await streamGroq(messages, res)
      return res.end()
    } catch (groqErr) {
      console.error('Groq também falhou:', groqErr.message)
      if (!res.headersSent || !res.writableEnded) {
        // se nada foi escrito ainda
        try { res.write('\n\n_Não foi possível conectar ao assistente no momento. Tente novamente._') } catch {}
      }
      return res.end()
    }
  }
}
