import { useState } from 'react'
import './App.css'
import Chat from './components/Chat'
import Planner from './components/Planner'

function App() {
  const [show, setShow] = useState('chat')

  return (
    <div className="app-root">
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1>AI Planner</h1>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShow('chat')} style={{ marginRight: 8 }}>Chat</button>
          <button onClick={() => setShow('planner')}>Planner</button>
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <section>
          <Chat />
        </section>
        <section>
          <Planner />
        </section>
      </main>
    </div>
  )
}

export default App
