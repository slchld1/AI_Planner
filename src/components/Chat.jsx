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
    const data = await res.json()
    console.log('Response data:', data)
    
    // Handle both Gemini and OpenAI formats
    const assistantText = 
      data.choices?.[0]?.message?.content ||  // OpenAI format
      data.candidates?.[0]?.content?.parts?.[0]?.text ||  // Gemini format
      'Error parsing response'
    
    const assistant = { role: 'assistant', content: assistantText }
    console.log('Extracted assistant:', assistant)
    setMessages((m) => [...m, assistant])
  } catch (err) {
    console.error('Fetch error:', err)
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
