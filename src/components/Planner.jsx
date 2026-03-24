import { useState } from 'react'

export default function Planner() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  function addTask() {
    if (!input) return
    setTasks((t) => [...t, { id: Date.now(), text: input }])
    setInput('')
  }

async function suggestTasks() {
  setLoading(true)
  try {
    // 1. Precise Prompt for JSON
    const prompt = `Based on these tasks: ${tasks.map(t => t.text).join(', ') || 'none'}, suggest 3 short actionable tasks and return JSON: {"suggestions":[...]}`
    const messages = [
      { role: 'system', content: 'You are a helpful planner. Respond with valid JSON.' },
      { role: 'user', content: prompt },
    ]

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })

    const ct = res.headers.get('content-type') || ''
    let payload
    if (ct.includes('application/json')) payload = await res.json()
    else {
      const txt = await res.text()
      try { payload = JSON.parse(txt) } catch { payload = { raw: txt } }
    }
    if (!res.ok) throw new Error(payload?.error?.message || payload?.raw || 'API error')

    // attempt to extract JSON from assistant content safely
    const raw = payload.choices?.[0]?.message?.content || payload.choices?.[0]?.text || payload.text || payload.raw || JSON.stringify(payload)
    let content
    try { content = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { content = null }
    const suggestions = (content?.suggestions && Array.isArray(content.suggestions)) ? content.suggestions : raw.split(/\r?\n/).map(l=>l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean).slice(0,3)
    const newTasks = suggestions.map(text => ({ id: crypto.randomUUID ? crypto.randomUUID() : Date.now()+Math.random(), text }))
    setTasks(prev => [...prev, ...newTasks])
   } catch (err) {
     console.error("Gemini Error:", err)
   } finally {
     setLoading(false)
   }
}


  return (
    <div className="planner">
      <h3>Planner</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="New task" style={{ flex: 1 }} />
        <button onClick={addTask}>Add</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={suggestTasks} disabled={loading}>{loading ? 'Thinking...' : 'Suggest tasks'}</button>
      </div>
      <ul style={{ marginTop: 8 }}>
        {tasks.map(t => (
          <li key={t.id}>{t.text}</li>
        ))}
      </ul>
    </div>
  )
}
