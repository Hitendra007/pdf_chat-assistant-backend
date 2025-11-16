// src/pages/ChatPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { API_BASE_URL, websocket_url } from '../api/Auth';

const ChatPage = () => {
  const { pdfId } = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [pdfHash, setPdfHash] = useState(null);
  const [pdfName, setPdfName] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef(null);
  const chatboxRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize sessionId, pdfHash, pdfName
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

  // Fetch chat history
  const fetchChatHistory = async (sId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/chat_data/chat_history`,
        {
          params: { session_id: sId },
          withCredentials: true,
        }
      );
      const hist = res.data.data.chat_history || [];
      setMessages(hist);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  // Open WebSocket after history is loaded
  useEffect(() => {
    if (!sessionId || loading) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(
      `${protocol}://${websocket_url}/api/v1/chat/ws/chat/${pdfId}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({ session_id: sessionId, is_legal_doc: false })
      );
    };

    ws.onmessage = (event) => {
      const data = event.data;
      if (data === '__END__') {
        // end of streaming
        setSending(false);
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

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setWsConnected(false);
      toast.error('Connection error. Please refresh the page.');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setWsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, loading, pdfId]);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a message
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || sending) return;
    
    if (!wsConnected) {
      toast.error('Not connected. Please wait...');
      return;
    }

    const userMessage = input.trim();
    setSending(true);
    
    // push user message immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
    ]);
    
    // and send to server
    try {
      wsRef.current.send(
        JSON.stringify({ message: userMessage, pdf_hash: pdfHash })
      );
      setInput('');
      // Pre-create an empty assistant message to collect tokens
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '' },
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <h1 className="text-2xl font-bold text-gray-800">
            {pdfName || 'Chat'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={`px-3 py-1 rounded-full ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chat Box */}
      <div
        ref={chatboxRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 p-6 mb-4 shadow-inner scroll-smooth"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading chat history…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Ask questions about your PDF document and get instant AI-powered answers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm break-words ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${msg.role === 'user' ? 'text-white opacity-90' : 'text-gray-600 opacity-80'}`}>
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className={`markdown-content prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : ''}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-800 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-800">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-800">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-800">{children}</li>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
                                {children}
                              </code>
                            ) : (
                              <code className={className}>{children}</code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm mb-2 border border-gray-200">
                              {children}
                            </pre>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          a: ({ href, children }) => (
                            <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3 text-gray-900">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-gray-900">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2 text-gray-900">{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {msg.content || '...'}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-white leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-3 items-end bg-white rounded-lg border border-gray-200 p-3 shadow-lg">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your question… (Press Enter to send, Shift+Enter for new line)"
          disabled={sending || !wsConnected}
          rows={1}
          className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          style={{ minHeight: '48px', maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending || !wsConnected}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
        >
          {sending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending</span>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
