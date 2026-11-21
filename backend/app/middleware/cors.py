
from fastapi.middleware.cors import CORSMiddleware

origins = [
    # Local development
    "http://localhost:5173",

    # Existing Vercel frontends
    "https://pdf-chat-assistant-backend-yt67.vercel.app",
    "https://pdf-chat-assistant-backend-77q3.vercel.app",

    # Google AI Studio Preview - Development
    "https://ais-dev-e6n35rkez3ai2657c4gmge-356223220153.asia-east1.run.app",

    # Google AI Studio Preview - Production
    "https://ais-pre-e6n35rkez3ai2657c4gmge-356223220153.asia-east1.run.app",
]

def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
