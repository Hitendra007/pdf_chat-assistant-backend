from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",   # Vite dev server
    # add prod URL here later, e.g. "https://myapp.com"
]
def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
