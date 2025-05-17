// src/pages/ChatPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

const ChatPage = () => {
  const { pdfId } = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [pdfHash, setPdfHash] = useState(null);
  const [pdfName, setPdfName] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);

  // 1️⃣ Initialize sessionId, pdfHash, pdfName
  useEffect(() => {
    let sId = localStorage.getItem('current_session_id');
    let pHash = localStorage.getItem('pdf_hash');
    let pName = localStorage.getItem('pdf_name');

    // If no session yet, generate one
    if (!sId) {
      sId = uuidv4();
      localStorage.setItem('current_session_id', sId);
    }
    if (!pHash) {
      // fallback to pdfId as hash if nothing else
      pHash = pdfId;
      localStorage.setItem('pdf_hash', pHash);
    }
    if (!pName) {
      pName = pdfId;
      localStorage.setItem('pdf_name', pName);
    }

    setSessionId(sId);
    setPdfHash(pHash);
    setPdfName(pName);

    // Fetch history once we have a session
    fetchChatHistory(sId);
  }, [pdfId]);

  // 2️⃣ Fetch chat history
  const fetchChatHistory = async (sId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://pdf-chat-assistant-backend.onrender.com/api/v1/chat_data/chat_history`,
        {
          params: { session_id: sId },
          withCredentials: true,
        }
      );
      const hist = res.data.data.chat_history || [];
      setMessages(hist);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Open WebSocket after history is loaded
  useEffect(() => {
    if (!sessionId || loading) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(
      `${protocol}://localhost:8000/api/v1/chat/ws/chat/${pdfId}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      // send init payload
      ws.send(
        JSON.stringify({ session_id: sessionId, is_legal_doc: false })
      );
    };

    ws.onmessage = (event) => {
      const data = event.data;
      if (data === '__END__') {
        // end of streaming
        return;
      }
      // streaming a token
      setMessages((prev) => {
        // if last message is assistant, append; otherwise push a new one
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + data,
          };
          return updated;
        } else {
          return [...prev, { role: 'assistant', content: data }];
        }
      });
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket closed');

    return () => ws.close();
  }, [sessionId, loading, pdfId]);

  // 4️⃣ Send a message
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;
    // push user message immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: input },
    ]);
    // and send to server
    wsRef.current.send(
      JSON.stringify({ message: input, pdf_hash: pdfHash })
    );
    setInput('');
    // Pre-create an empty assistant message to collect tokens
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '' },
    ]);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Chat with: {pdfName}</h1>

      <div style={styles.chatBox}>
        {loading ? (
          <p>Loading chat history…</p>
        ) : messages.length === 0 ? (
          <p>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                ...(msg.role === 'user'
                  ? styles.userMessage
                  : styles.assistantMessage),
              }}
            >
              <strong>
                {msg.role === 'user' ? 'You' : 'AI'}:
              </strong>{' '}
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          ))
        )}
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
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
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
