import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Badge } from '../../components/UI'
import { aiService, courseService, materialService } from '../../services'
import { handleApiError, toast } from '../../utils/toast'

export const StudentAIChatPage = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materials, setMaterials] = useState([])
  const [mode, setMode] = useState('explainer')
  const [difficulty, setDifficulty] = useState('beginner')
  const [assistantMode, setAssistantMode] = useState('materials') // materials | web
  const [uploading, setUploading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [ingestResult, setIngestResult] = useState(null)
  const [chatId, setChatId] = useState(null)
  const fileRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await courseService.getStudentCourses()
        setCourses(res.data || [])
        const first = res.data?.[0]?._id
        if (first) setSelectedCourseId(first)
      } catch (err) {
        handleApiError(err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedCourseId) return
      try {
        const res = await materialService.getByCourse(selectedCourseId)
        setMaterials(res.data || [])
      } catch (err) {
        handleApiError(err)
      }
    }
    loadMaterials()
  }, [selectedCourseId])

  const canChat = useMemo(() => Boolean(selectedCourseId), [selectedCourseId])

  const send = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    if (assistantMode === 'materials' && !canChat) return toast.error('Select a course first')
    const userMsg = { role: 'user', text: message.trim() }
    setMessages((prev) => [...prev, userMsg])
    setMessage('')
    setLoading(true)
    try {
      if (assistantMode === 'web') {
        const res = await aiService.webSearch({ query: userMsg.text, difficulty })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.answer,
            sources: res.data.sources || [],
          },
        ])
      } else {
        const res = await aiService.chatRag({
          message: userMsg.text,
          courseId: selectedCourseId,
          mode,
          difficulty,
          topK: 6,
          chatId,
        })
        if (res.data?.chatId) setChatId(res.data.chatId)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.answer,
            citations: res.data.citations || [],
          },
        ])
      }
    } catch (err) {
      handleApiError(err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            'Sorry — the assistant failed to respond. Please try again in a few seconds.\n\nTip: make sure the backend is running and that you ingested at least one material for this course.',
          citations: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Keep view pinned to latest message
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, loading])

  const ingest = async () => {
    if (assistantMode === 'web') return toast.info('Switch to “My Materials (RAG)” to ingest files')
    if (!selectedCourseId) return toast.error('Select a course first')
    const file = fileRef.current?.files?.[0]
    if (!file) return toast.error('Choose a file to ingest')

    setUploading(true)
    setIngesting(true)
    setIngestResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('courseId', selectedCourseId)
      fd.append('subject', '')
      fd.append('chapter', '')
      fd.append('topic', '')
      fd.append('title', file.name)
      fd.append('description', 'Ingested for AI assistant')

      const res = await aiService.ingest(fd)
      toast.success(`Ingested (${res.data.chunksCreated} chunks)`)
      setIngestResult({
        fileName: file.name,
        chunksCreated: res.data.chunksCreated,
        embeddingModel: res.data.embeddingModel,
      })
      // refresh visible materials list for the course
      const mRes = await materialService.getByCourse(selectedCourseId)
      setMaterials(mRes.data || [])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      handleApiError(err)
    } finally {
      setUploading(false)
      setIngesting(false)
    }
  }

  return (
    <DashboardLayout title="AI Study Assistant">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Materials & Scope" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Assistant</label>
              <select
                className="input"
                value={assistantMode}
                onChange={(e) => {
                  setAssistantMode(e.target.value)
                  setMessages([])
                  setChatId(null)
                }}
              >
                <option value="materials">My Materials (RAG)</option>
                <option value="web">Web Search (General)</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                RAG answers only from your uploaded files. Web Search summarizes top results and includes links.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Course</label>
              <select
                className="input"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={assistantMode === 'web'}
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Mode</label>
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="explainer">Explainer</option>
                <option value="clarifier">Doubt Clarifier</option>
                <option value="quiz">Quiz Generator</option>
                <option value="summarizer">Summarizer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Difficulty</label>
              <select
                className="input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="exam">Exam</option>
              </select>
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Ingest a file for AI</div>
                <Badge variant={ingesting ? 'warning' : 'info'}>{ingesting ? 'Working' : 'Ready'}</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Upload PDF/DOCX/PPTX/images. The assistant will answer only from your ingested content.
              </p>
              <input
                ref={fileRef}
                type="file"
                className="mt-3 block w-full text-sm"
                accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.txt"
                disabled={assistantMode === 'web'}
              />
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={ingest} disabled={uploading || !selectedCourseId}>
                  {uploading ? 'Uploading…' : 'Upload & Ingest'}
                </Button>
              </div>
              {ingestResult && (
                <div className="mt-3 text-xs bg-white border rounded-lg p-2">
                  <div className="font-semibold">Ingestion result</div>
                  <div className="text-gray-700 mt-1">
                    File: <span className="font-medium">{ingestResult.fileName}</span>
                  </div>
                  <div className="text-gray-700">
                    Chunks created: <span className="font-medium">{ingestResult.chunksCreated}</span>
                  </div>
                  <div className="text-gray-700">
                    Embedding model:{' '}
                    <span className="font-medium">{ingestResult.embeddingModel || 'not configured'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Materials in this course</div>
                <Badge variant="info">{materials.length}</Badge>
              </div>
              <div className="mt-2 max-h-[240px] overflow-auto border rounded-lg">
                {materials.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600">No materials yet.</div>
                ) : (
                  <div className="divide-y">
                    {materials.map((m) => (
                      <a
                        key={m._id}
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-3 hover:bg-gray-50 text-sm"
                      >
                        <div className="font-medium">{m.title}</div>
                        <div className="text-xs text-gray-500">{m.fileType}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Chat" className="lg:col-span-2">
          <div
            ref={listRef}
            className="h-[55vh] overflow-auto border rounded-lg p-3 bg-gray-50"
          >
            {messages.length === 0 ? (
              <p className="text-gray-600">
                Ask a question. If nothing is ingested yet, you’ll get “No relevant content found…”.
              </p>
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
                    {m.role === 'assistant' && Array.isArray(m.citations) && m.citations.length > 0 && (
                      <div className="mt-2 text-left">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Sources</div>
                        <div className="space-y-2">
                          {m.citations.map((c) => (
                            <div key={c.tag} className="text-xs bg-white border rounded-lg p-2">
                              <div className="font-semibold">
                                [{c.tag}] {c.subject || ''} {c.chapter ? `• ${c.chapter}` : ''}{' '}
                                {c.topic ? `• ${c.topic}` : ''}
                              </div>
                              <div className="text-gray-700 mt-1 whitespace-pre-wrap">{c.snippet}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.role === 'assistant' && Array.isArray(m.sources) && m.sources.length > 0 && (
                      <div className="mt-2 text-left">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Web sources</div>
                        <div className="space-y-2">
                          {m.sources.slice(0, 6).map((s) => (
                            <a
                              key={s.link}
                              href={s.link}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs bg-white border rounded-lg p-2 hover:bg-gray-50"
                            >
                              <div className="font-semibold">{s.title || s.link}</div>
                              <div className="text-gray-700 mt-1">{s.snippet}</div>
                              <div className="text-blue-700 mt-1 break-all">{s.link}</div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={send} className="mt-4 flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label=""
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question…"
                required
              />
            </div>
            <Button type="submit" disabled={loading || (assistantMode === 'materials' && !selectedCourseId)}>
              {loading ? '...' : 'Send'}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

