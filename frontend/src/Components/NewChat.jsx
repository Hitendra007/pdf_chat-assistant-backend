// src/Components/NewChat.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../api/Auth';

function NewChat() {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (file) => {
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      toast.success('PDF file selected');
    } else {
      toast.error('Please select a valid PDF file');
      setPdfFile(null);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      setUploading(true);
      const res = await axios.post(
        `${API_BASE_URL}/pdf/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // You could show a progress toast here if needed
          },
        }
      );

      const payload = res.data.data;
      const pdfObj = payload.pdf ?? payload;

      const { id: pdf_id, hash: pdf_hash, name: pdf_name } = pdfObj;
      const session_id = crypto.randomUUID();

      // Save session info
      localStorage.setItem('current_session_id', session_id);
      localStorage.setItem('pdf_hash', pdf_hash);
      localStorage.setItem('pdf_name', pdf_name);

      toast.success('PDF uploaded successfully! Starting chat...');
      navigate(`/chat/${pdf_id}`);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to upload PDF. Please try again.';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Start a New Chat</h2>
            <p className="text-gray-600">Upload a PDF document to begin chatting with AI</p>
          </div>

          {/* File Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : pdfFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleInputChange}
              className="hidden"
              disabled={uploading}
            />

            {pdfFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-1">{pdfFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(pdfFile.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Drag and drop your PDF here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <button
                    type="button"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
                <p className="text-xs text-gray-400">Only PDF files are supported</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="mt-8">
            <button
              onClick={handleUpload}
              disabled={!pdfFile || uploading}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100 ${
                !pdfFile || uploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading and processing...</span>
                </div>
              ) : (
                'Upload and Start Chat'
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-sm font-medium text-gray-700">Secure</p>
                <p className="text-xs text-gray-500">Your files are safe</p>
              </div>
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm font-medium text-gray-700">Fast</p>
                <p className="text-xs text-gray-500">Quick processing</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-sm font-medium text-gray-700">AI-Powered</p>
                <p className="text-xs text-gray-500">Smart responses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewChat;
