// src/Components/ChatPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatPage = () => {
  const { pdfId } = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [pdfHash, setPdfHash] = useState(null);
  const [pdfName, setPdfName] = useState(null);

  const [messages, setMessages] = useState([]); // { role, content }
  const [input, setInput] = useState('');
  const streamingRef = useRef(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Load saved chat info
    setSessionId(localStorage.getItem('current_session_id'));
    setPdfHash(localStorage.getItem('pdf_hash'));
    setPdfName(localStorage.getItem('pdf_name'));

    // Open WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://localhost:8000/api/v1/chat/ws/chat/${pdfId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ session_id: sessionId, is_legal_doc: false }));
    };

    ws.onmessage = (event) => {
      const chunk = event.data;
      if (chunk === '__END__') {
        streamingRef.current = false;
        return;
      }

      // Normalize line breaks
      const normalized = chunk.replace(/\r\n/g, '\n');

      if (!streamingRef.current) {
        streamingRef.current = true;
        setMessages((prev) => [...prev, { role: 'assistant', content: normalized }]);
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          last.content += normalized;
          return updated;
        });
      }
    };

    ws.onerror = console.error;
    ws.onclose = () => console.log('WebSocket closed');

    return () => ws.close();
  }, [pdfId, sessionId]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || !pdfHash) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    wsRef.current.send(JSON.stringify({ message: input, pdf_hash: pdfHash }));
    setInput('');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Chat with: {pdfName || pdfId}</h1>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            {msg.role === 'assistant' ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              <span> {msg.content}</span>
            )}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 800,
    margin: '2rem auto',
    padding: '1rem',
    fontFamily: 'sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  chatBox: {
    minHeight: 400,
    maxHeight: '60vh',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '1rem',
    background: '#fafafa',
    overflowY: 'auto',
    marginBottom: '1rem',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
  message: {
    marginBottom: '1rem',
    padding: '10px 15px',
    borderRadius: 10,
    maxWidth: '100%',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: '#fff',
    marginLeft: 'auto',
    textAlign: 'right',
    borderTopLeftRadius: 0,
    maxWidth: '60%',
  },
  assistantMessage: {
    backgroundColor: '#f1f1f1',
    color: '#333',
    margin: 0,
    textAlign: 'left',
    borderTopRightRadius: 0,
    width: '100%',
  },
  inputArea: {
    display: 'flex',
    marginTop: '1rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: 4,
    border: '1px solid #ccc',
    marginRight: '0.5rem',
  },
  button: {
    padding: '0.75rem 1.2rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};

export default ChatPage;
