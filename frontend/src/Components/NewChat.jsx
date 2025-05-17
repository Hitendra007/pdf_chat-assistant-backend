// src/Components/NewChat.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NewChat() {
  const [pdfFile, setPdfFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const res = await axios.post(
        'https://pdf-chat-assistant-backend.onrender.com/api/v1/pdf/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      const payload = res.data.data;
      // payload may be { pdf: {...} } or directly { id, hash, name, user_id }
      const pdfObj = payload.pdf ?? payload;

      const { id: pdf_id, hash: pdf_hash, name: pdf_name } = pdfObj;
      const session_id = crypto.randomUUID();

      // Save session info
      localStorage.setItem('current_session_id', session_id);
      localStorage.setItem('pdf_hash', pdf_hash);
      localStorage.setItem('pdf_name', pdf_name);

      navigate(`/chat/${pdf_id}`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload and start chat.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Start a New Chat</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button style={styles.button} onClick={handleUpload}>
        Upload and Start Chat
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    textAlign: 'center',
  },
  button: {
    marginTop: '1rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default NewChat;
