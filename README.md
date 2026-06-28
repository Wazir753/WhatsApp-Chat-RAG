# WhatsApp Chat RAG

A production-ready RAG (Retrieval-Augmented Generation) application for analyzing WhatsApp chat exports using local embeddings and vector storage.

## Features

- **File Upload**: Drag-and-drop upload for WhatsApp .txt export files with progress tracking
- **Smart Parsing**: Handles both Android and iOS WhatsApp export formats
- **Local Embeddings**: Uses sentence-transformers all-MiniLM-L6-v2 (100% local, no API calls)
- **Vector Storage**: ChromaDB with persistent disk storage
- **Chat Interface**: Clean dark UI for querying chat history with source citations
- **Advanced Filters**: Filter by participant, date range, and keywords
- **Analytics Dashboard**: Visual stats including message counts, activity patterns, and word frequency
- **Dual LLM Support**: Claude (primary) with Mistral-7B fallback via HuggingFace

## Tech Stack

### Backend
- FastAPI (Python)
- sentence-transformers (local HuggingFace embeddings)
- ChromaDB (local vector store)
- Anthropic API (Claude)
- HuggingFace Inference API (Mistral fallback)

### Frontend
- React 16 (plain JavaScript)
- Recharts (data visualization)
- Axios (HTTP client)

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- Anthropic API key
- HuggingFace token (optional, for fallback)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HF_TOKEN=your_huggingface_token_here
```

5. Start the backend server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Upload**: Drag and drop your WhatsApp .txt export file
2. **Embed**: Wait for the embedding process to complete (shows real-time progress)
3. **Chat**: Ask questions about your chat history
4. **Filter**: Use sidebar filters to narrow down search results
5. **Stats**: View analytics including activity patterns and word frequency

## API Endpoints

- `POST /upload` - Upload WhatsApp .txt file
- `POST /embed` - Trigger embedding pipeline
- `GET /embed/progress` - Get embedding progress
- `POST /chat` - Query with RAG
- `GET /stats` - Get conversation analytics
- `DELETE /reset` - Clear ChromaDB collection
- `GET /health` - Health check

## File Structure

```
whatsapp RAG/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── parser.py            # WhatsApp format parser
│   ├── embedder.py          # HuggingFace embedding logic
│   ├── retriever.py         # ChromaDB search logic
│   ├── llm.py               # Claude + Mistral LLM calls
│   ├── requirements.txt      # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── Upload.js    # File upload component
│   │       ├── Upload.css
│   │       ├── Chat.js      # Chat interface
│   │       ├── Chat.css
│   │       ├── Stats.js     # Analytics dashboard
│   │       ├── Stats.css
│   │       ├── Filters.js   # Filter sidebar
│   │       └── Filters.css
│   └── package.json
└── README.md
```

## Notes

- ChromaDB data is persisted to disk in `backend/chroma_db/`
- Re-uploading the same file will re-embed (use Reset to start fresh)
- The embedding model downloads on first run (~100MB)
- Claude API is used by default; Mistral-7B is fallback if Claude fails
- All embeddings are computed locally (no external API calls for embeddings)

## Troubleshooting

- **CORS errors**: Ensure backend is running on port 8000
- **Embedding fails**: Check Python dependencies and disk space
- **LLM errors**: Verify API keys in `.env` file
- **Frontend build errors**: Clear node_modules and reinstall

## License

MIT
