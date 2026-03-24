import { useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant that helps with planning.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!input) return
    const userMsg = { role: 'user', content: input }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      // safe parse
      const ct = res.headers.get('content-type') || ''
      let data
      if (ct.includes('application/json')) data = await res.json()
      else {
        const txt = await res.text()
        try { data = JSON.parse(txt) } catch { data = { raw: txt } }
      }
      if (!res.ok) throw new Error(data?.error?.message || data?.raw || 'API error')
      const assistant = data.choices?.[0]?.message || { role: 'assistant', content: data.choices?.[0]?.text || data.text || data.raw || JSON.stringify(data) }
       setMessages((m) => [...m, assistant])
     } catch (err) {
       setMessages((m) => [...m, { role: 'assistant', content: 'Error: ' + err.message }])
     } finally {
       setLoading(false)
     }
  }
  return (
    <div className="chat">
      <h3>AI Chat</h3>
      <div className="messages" style={{ minHeight: 180, border: '1px solid #ddd', padding: 8, borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong style={{ textTransform: 'capitalize' }}>{m.role}:</strong>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Say something..." style={{ flex: 1 }} />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
