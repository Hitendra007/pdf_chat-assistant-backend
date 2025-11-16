import React from 'react';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Home() {
  const { chat_sessions, loading } = useChat();
  const navigate = useNavigate();

  const handleSessionClick = (session) => {
    if (!session.pdf || !session.pdf.hash) {
      toast.error("This session has no associated PDF.");
      return;
    }

    localStorage.setItem('current_session_id', session.id);
    localStorage.setItem('pdf_hash', session.pdf.hash);
    localStorage.setItem('pdf_name', session.pdf.name);
    navigate(`/chat/${session.pdf.id}`);
  };

  const handleNewChat = () => {
    navigate('/new-chat');
  };

  const validSessions = chat_sessions?.filter(
    (session) => session.pdf_id && session.pdf?.hash
  ) || [];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Chat Sessions</h2>
            <p className="text-gray-600">Continue your conversations or start a new one</p>
          </div>
          <button
            onClick={handleNewChat}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Chat
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading your sessions...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && validSessions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No chat sessions yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start a new conversation by uploading a PDF document. Get instant answers and insights from your documents.
            </p>
            <button
              onClick={handleNewChat}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Upload Your First PDF
            </button>
          </div>
        )}

        {/* Sessions Grid */}
        {!loading && validSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate" title={session.pdf?.name || 'Unnamed PDF'}>
                          {session.pdf?.name || 'Unnamed PDF'}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">Session ID: {session.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">PDF ID: {session.pdf.id}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Click to continue</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
