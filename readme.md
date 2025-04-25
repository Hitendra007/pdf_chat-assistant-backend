# 📄 Chat with PDF AI Assistant

An intelligent document assistant that allows users to **chat with PDFs**. Upload your document, ask questions, and get context-aware answers powered by Large Language Models, vector embeddings, and real-time interaction.

---

## ✨ Features

- 🧠 Chat with documents using LLMs
- 📤 Upload PDF files and extract meaningful context
- 🔎 Fast semantic search using Qdrant vector store
- 💬 Real-time chat with WebSocket support
- 🔐 Secure JWT-based authentication (via cookies)
- 🗂️ Chat history stored in PostgreSQL
- ⚖️ Enhanced query propagation for legal documents
- 🐳 Qdrant runs via Docker

---

## 🧰 Tech Stack

### 🔙 Backend
- **FastAPI** — Python web framework
- **PostgreSQL** — Database for chat history and user sessions
- **Qdrant** — Vector store for embeddings (Dockerized)
- **Sentence Transformers / LangChain / PyPDFLoader** — PDF parsing & embedding
- **JWT** — Auth with secure cookies
- **WebSocket** — Real-time bi-directional communication

### 🌐 Frontend
- **React** — UI for chat interface and file upload
- **WebSocket** — For interactive chat flow
- **Axios** — For REST API communication

---

## 📁 Project Structure

```
pdf_chat-assistant-backend/
│
├── backend/
│   ├── api/              # FastAPI route definitions
│   ├── core/             # Config and JWT logic
│   ├── services/         # Embedding, PDF handling, chat service
│   ├── db/               # Database setup and queries
│   ├── utils/            # Utility/helper functions
│   ├── main.py           # FastAPI app entry point
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── public/
│   ├── src/              # React components and logic
│   └── package.json      # Frontend dependencies
│
└── docker-compose.yml    # Qdrant service via Docker
```

---

## 🚀 Getting Started

### 🐳 Step 1: Run Qdrant with Docker

```bash
docker-compose up -d
```

Qdrant will be accessible at `http://localhost:6333`.

---

### ⚙️ Step 2: Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  
On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### ▶️ Run the FastAPI server

```bash
uvicorn app.main:app --reload
```

Backend will run at: `http://localhost:8000`

---

### 🌐 Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🔐 Authentication

- JWT-based authentication using HTTP-only cookies
- Users must be authenticated to:
  - Upload PDFs
  - Initiate chat
  - View chat history

---

## 🧠 How It Works

1. User uploads a PDF
2. The PDF is parsed and split into text chunks
3. Embeddings are created and stored in Qdrant
4. Chat initiated over WebSocket
5. Query is semantically matched with relevant chunks
6. Contextual answer is generated using the LLM
7. Chat history is saved to PostgreSQL

---

## 📝 Chat History

- All interactions are stored in a PostgreSQL database
- Linked to user sessions
- Accessible for review and re-engagement

---

## 📌 TODO / Improvements

- [ ] Support for other file types (DOCX, TXT, etc.)
- [ ] Enhanced summarization per page or section
- [ ] OAuth login (Google, GitHub)
- [ ] Admin panel and user dashboard
- [ ] Rate limiting and user analytics
- [ ] Cloud deployment support (Vercel, Railway)
- [ ] Advanced query reasoning for regulatory/legal documents
- [ ] Implement enhanced legal document query propagation system

---

## 🤝 Contribution

We welcome contributions! Feel free to:
- Fork the repo
- Create pull requests
- Submit issues and suggestions

---



## 💡 Acknowledgements

Built with ❤️ using FastAPI, Qdrant, React, and OpenAI technologies.


