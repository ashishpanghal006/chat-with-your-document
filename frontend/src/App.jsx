import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  };

  const uploadPDF = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("http://localhost:8000/upload", formData);
      setDocumentId(res.data.document_id);
      setFileName(res.data.filename);
      loadDocuments();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/documents");
      setDocuments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteDocument = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/documents/${id}`);
      if (id === documentId) {
        setDocumentId("");
        setFileName("");
        setMessages([]);
        setSources([]);
      }
      loadDocuments();
    } catch (error) {
      console.error(error);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !documentId) return;
    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion("");
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8000/ask", {
        question: currentQuestion,
        document_id: documentId,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
      setSources(res.data.sources);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #0f0f0f;
          --surface:   #161616;
          --surface2:  #1e1e1e;
          --border:    #2a2a2a;
          --amber:     #e8a84c;
          --amber-dim: #c4872e;
          --text:      #e8e3d8;
          --muted:     #666;
          --user-bg:   #1a160d;
          --ai-bg:     #161616;
          --ff-head:   'Playfair Display', Georgia, serif;
          --ff-mono:   'JetBrains Mono', monospace;
          --ff-body:   'DM Sans', sans-serif;
          --sidebar-w: 340px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--ff-body);
          height: 100vh;
          overflow: hidden;
        }

        .layout {
          display: flex;
          height: 100vh;
        }

        /* ── SIDEBAR ─────────────────────────────── */
        .sidebar {
          width: var(--sidebar-w);
          min-width: var(--sidebar-w);
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden; /* no global scroll — sections scroll individually */
        }

        /* Top static section: brand + upload */
        .sidebar-top {
          padding: 28px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
        }

        /* Bottom scrollable panels split evenly */
        .sidebar-panels {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .sidebar-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 16px 24px;
        }

        .sidebar-panel + .sidebar-panel {
          border-top: 1px solid var(--border);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-shrink: 0;
        }

        .panel-count {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--amber);
          background: rgba(232,168,76,0.1);
          border: 1px solid rgba(232,168,76,0.2);
          border-radius: 4px;
          padding: 2px 6px;
        }

        .panel-toggle {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .panel-toggle:hover { color: var(--amber); }

        /* Scrollable list inside a panel */
        .panel-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
          padding-right: 2px;
        }

        .panel-list::-webkit-scrollbar { width: 3px; }
        .panel-list::-webkit-scrollbar-track { background: transparent; }
        .panel-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .panel-empty {
          font-size: 11px;
          color: var(--muted);
          font-family: var(--ff-mono);
          padding: 8px 0;
          line-height: 1.6;
        }

        .brand {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-label {
          font-family: var(--ff-mono);
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--amber);
          text-transform: uppercase;
        }

        .brand-title {
          font-family: var(--ff-head);
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.2;
        }

        /* Drop zone */
        .dropzone {
          border: 1.5px dashed var(--border);
          border-radius: 10px;
          padding: 20px 16px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: transparent;
        }

        .dropzone.active,
        .dropzone:hover {
          border-color: var(--amber);
          background: rgba(232,168,76,0.04);
        }

        .dropzone-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .dropzone-text {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }

        .dropzone-text strong {
          color: var(--text);
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .upload-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .file-pill {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface2);
          border: 1px solid rgba(232,168,76,0.25);
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 11px;
          min-width: 0;
          animation: fadeUp 0.3s ease;
        }

        .file-pill-icon { color: var(--amber); font-size: 14px; flex-shrink: 0; }

        .file-pill-name {
          font-family: var(--ff-mono);
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--amber);
        }

        .btn-upload {
          padding: 9px 16px;
          border-radius: 8px;
          border: none;
          background: var(--amber);
          color: #0f0f0f;
          font-family: var(--ff-body);
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          letter-spacing: 0.3px;
          transition: background 0.2s, transform 0.1s;
          flex-shrink: 0;
        }

        .btn-upload:hover { background: #f0b85e; }
        .btn-upload:active { transform: scale(0.98); }
        .btn-upload:disabled { background: #3a2e1a; color: #7a6030; cursor: default; }

        /* Document card */
        .doc-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          animation: fadeUp 0.3s ease;
        }

        .doc-card:hover { background: #222; }

        .doc-card.active {
          border-color: var(--amber);
          background: rgba(232,168,76,0.05);
        }

        .doc-card-icon {
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .doc-card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-card-name {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-card.active .doc-card-name { color: var(--amber); }

        .doc-card-label {
          font-size: 10px;
          color: var(--muted);
        }

        .btn-delete {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 13px;
          flex-shrink: 0;
          padding: 2px;
          border-radius: 4px;
          transition: color 0.2s, background 0.2s;
          line-height: 1;
        }

        .btn-delete:hover { color: #ff6b6b; background: rgba(255,107,107,0.1); }

        /* Source card */
        .source-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-left: 2px solid var(--amber);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11.5px;
          color: #aaa;
          line-height: 1.65;
          font-family: var(--ff-mono);
          animation: fadeUp 0.3s ease;
        }

        /* ── CHAT AREA ───────────────────────────── */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg);
        }

        .chat-header {
          padding: 18px 36px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .chat-header-title {
          font-family: var(--ff-head);
          font-size: 16px;
          color: var(--text);
        }

        .chat-header-doc {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--amber);
          background: rgba(232,168,76,0.08);
          border: 1px solid rgba(232,168,76,0.2);
          border-radius: 5px;
          padding: 3px 8px;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: var(--ff-mono);
          color: var(--muted);
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--border);
        }

        .dot.ready {
          background: #4caf72;
          box-shadow: 0 0 6px #4caf7266;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 28px 36px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          text-align: center;
          color: var(--muted);
          padding: 40px;
        }

        .empty-glyph {
          font-family: var(--ff-head);
          font-size: 60px;
          line-height: 1;
          opacity: 0.1;
          color: var(--amber);
          user-select: none;
        }

        .empty-heading {
          font-family: var(--ff-head);
          font-size: 24px;
          color: var(--text);
          opacity: 0.5;
          font-weight: 400;
        }

        .empty-sub {
          font-size: 13px;
          color: var(--muted);
          max-width: 280px;
          line-height: 1.6;
        }

        /* Messages */
        .message-row {
          display: flex;
          animation: fadeUp 0.25s ease;
        }

        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .bubble {
          max-width: 72%;
          padding: 14px 18px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.75;
          position: relative;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .bubble.user {
          background: var(--user-bg);
          border: 1px solid #3a2e1a;
          border-bottom-right-radius: 4px;
          color: var(--amber);
          font-family: var(--ff-body);
        }

        .bubble.assistant {
          background: var(--ai-bg);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
          color: var(--text);
        }

        .bubble-label {
          font-family: var(--ff-mono);
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
          opacity: 0.4;
        }

        .thinking {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 14px 18px;
          background: var(--ai-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          border-bottom-left-radius: 4px;
          animation: fadeUp 0.2s ease;
        }

        .thinking span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--amber);
          animation: bounce 1.2s infinite;
        }

        .thinking span:nth-child(2) { animation-delay: 0.2s; }
        .thinking span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* Input area */
        .input-bar {
          padding: 16px 36px 20px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }

        .input-row {
          display: flex;
          gap: 12px;
          align-items: center;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px 4px 4px 18px;
          transition: border-color 0.2s;
        }

        .input-row:focus-within {
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(232,168,76,0.07);
        }

        .input-row input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-family: var(--ff-body);
          font-size: 14px;
          padding: 10px 0;
        }

        .input-row input::placeholder { color: var(--muted); }

        .btn-send {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          border: none;
          background: var(--amber);
          color: #0f0f0f;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-send:hover { background: #f0b85e; }
        .btn-send:active { transform: scale(0.93); }
        .btn-send:disabled { background: #2a2a2a; color: var(--muted); cursor: default; }

        .input-hint {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--muted);
          margin-top: 8px;
          padding-left: 4px;
          letter-spacing: 0.5px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          font-family: var(--ff-mono);
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--muted);
          text-transform: uppercase;
        }
      `}</style>

      <div className="layout">

        {/* ── Sidebar ── */}
        <aside className="sidebar">

          {/* Top: brand + upload controls */}
          <div className="sidebar-top">
            <div className="brand">
              <span className="brand-label">Document AI</span>
              <h1 className="brand-title">Chat with<br />your PDFs</h1>
            </div>

            {/* Drop zone */}
            <div
              className={`dropzone${dragOver ? " active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="dropzone-icon">📄</div>
              <div className="dropzone-text">
                <strong>{file ? file.name : "Drop PDF here"}</strong>
                {file ? "Ready to upload" : "or click to browse"}
              </div>
            </div>

            <div className="upload-row">
              {fileName && (
                <div className="file-pill">
                  <span className="file-pill-icon">✓</span>
                  <span className="file-pill-name">{fileName}</span>
                </div>
              )}
              <button className="btn-upload" onClick={uploadPDF} disabled={!file || uploading}>
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>

          {/* Bottom panels: documents + sources, each independently scrollable */}
          <div className="sidebar-panels">

            {/* Panel 1: Uploaded Documents */}
            <div className="sidebar-panel">
              <div className="panel-header">
                <span className="section-label">Documents</span>
                {documents.length > 0 && (
                  <span className="panel-count">{documents.length}</span>
                )}
              </div>
              <div className="panel-list">
                {documents.length === 0 ? (
                  <p className="panel-empty">No documents yet. Upload a PDF to get started.</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.document_id}
                      className={`doc-card${documentId === doc.document_id ? " active" : ""}`}
                      onClick={() => {
                        setDocumentId(doc.document_id);
                        setFileName(doc.filename);
                      }}
                    >
                      <span className="doc-card-icon">📄</span>
                      <div className="doc-card-info">
                        <span className="doc-card-name">{doc.filename}</span>
                        {documentId === doc.document_id && (
                          <span className="doc-card-label">Active</span>
                        )}
                      </div>
                      <button
                        className="btn-delete"
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc.document_id); }}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel 2: Sources */}
            <div className="sidebar-panel">
              <div className="panel-header">
                <span className="section-label">Sources</span>
                <button className="panel-toggle" onClick={() => setShowSources(!showSources)}>
                  {showSources ? "Hide" : "Show"}
                </button>
              </div>
              {showSources && (
                <div className="panel-list">
                  {sources.length === 0 ? (
                    <p className="panel-empty">Sources appear here after your first query.</p>
                  ) : (
                    sources.map((src, i) => (
                      <div key={i} className="source-card">{src}</div>
                    ))
                  )}
                </div>
              )}
              {!showSources && (
                <p className="panel-empty">
                  {sources.length > 0 ? `${sources.length} source${sources.length > 1 ? "s" : ""} available` : "No sources yet."}
                </p>
              )}
            </div>

          </div>
        </aside>

        {/* ── Chat Area ── */}
        <main className="chat-area">

          <header className="chat-header">
            <span className="chat-header-title">Conversation</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {fileName && <span className="chat-header-doc">📄 {fileName}</span>}
              <div className="status-dot">
                <span className={`dot ${documentId ? "ready" : ""}`} />
                {documentId ? "Document loaded" : "Awaiting document"}
              </div>
            </div>
          </header>

          <div className="messages">

            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-glyph">❝</div>
                <p className="empty-heading">Ask anything</p>
                <p className="empty-sub">Upload a PDF and start asking questions about its contents.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className={`bubble ${msg.role}`}>
                  <div className="bubble-label">{msg.role === "user" ? "You" : "AI"}</div>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="thinking">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-bar">
            <div className="input-row">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={documentId ? "Ask a question about your document…" : "Upload a document first…"}
                disabled={!documentId || loading}
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              />
              <button className="btn-send" onClick={askQuestion} disabled={!documentId || loading || !question.trim()} title="Send">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <p className="input-hint">Press Enter to send</p>
          </div>

        </main>
      </div>
    </>
  );
}