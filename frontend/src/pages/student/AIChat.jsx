import { useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input } from '../../components/UI'
import api from '../../services/api'
import { handleApiError } from '../../utils/toast'

export const StudentAIChatPage = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const send = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    const userMsg = { role: 'user', text: message.trim() }
    setMessages((prev) => [...prev, userMsg])
    setMessage('')
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', { message: userMsg.text })
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.answer }])
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="AI Study Assistant">
      <Card>
        <div className="h-[55vh] overflow-auto border rounded-lg p-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-600">Ask anything about your course topics.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <Input
            label=""
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question…"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? '...' : 'Send'}
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  )
}

