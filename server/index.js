import express from 'express'
import dotenv from 'dotenv'
import { GoogleAuth } from 'google-auth-library'
dotenv.config()

const app = express()
app.use(express.json())

// Call Gemini/Vertex AI. Uses GEMINI_API_KEY if set, otherwise uses ADC (service account).
async function callGemini(promptText) {
  const model = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro'
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  const base = 'https://generativelanguage.googleapis.com/v1'
  const url = apiKey
    ? `${base}/models/${model}:generate?key=${apiKey}`
    : `${base}/models/${model}:generate`

  const body = {
    prompt: { text: promptText },
    maxOutputTokens: 256,
  }

  const headers = { 'Content-Type': 'application/json' }
  if (!apiKey) {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    headers.Authorization = `Bearer ${token.token || token}`
  }

  try {
    console.log('Calling upstream:', url)
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('Upstream status:', res.status, 'body preview:', (text || '').slice(0, 1000))
    try { return { ok: res.ok, status: res.status, json: JSON.parse(text) } }
    catch { return { ok: res.ok, status: res.status, raw: text } }
  } catch (err) {
    console.error('Upstream call failed:', err)
    return { ok: false, status: 502, raw: String(err) }
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Incoming /api/chat', { body: req.body })
    const { messages } = req.body
    if (!messages) return res.status(400).json({ error: 'messages required' })
    const promptText = messages.map(m => `${m.role}: ${m.content}`).join('\n')
    const out = await callGemini(promptText)
    console.log('callGemini result status:', out.status)
    if (!out.ok) return res.status(out.status).send(out.json ?? out.raw ?? 'upstream error')
    return res.json(out.json)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3000, ()=> console.log('server listening on http://localhost:3000'))