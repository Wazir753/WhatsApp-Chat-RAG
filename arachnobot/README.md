# 🕷️ ArachnoBot - WhatsApp AI Assistant

A production-ready WhatsApp AI bot with RAG capabilities, featuring a spider-themed interface and fully free stack using local embeddings and HuggingFace Mistral-7B.

## Features

- **WhatsApp Bridge**: Baileys-based personal number bot with QR authentication
- **Local Embeddings**: sentence-transformers all-MiniLM-L6-v2 (100% local, no API calls)
- **Vector Storage**: ChromaDB with persistent disk storage
- **Free LLM**: Mistral-7B-Instruct via HuggingFace Inference API (free tier)
- **Interactive Menu**: Numbered menu system for easy navigation
- **Conversation Memory**: Per-user memory with 30-minute timeout
- **Real-time Dashboard**: React dashboard with WebSocket live activity feed
- **Analytics**: Message counts, response times, query type breakdowns
- **Spider Theme**: Dark UI with spider-web CSS patterns (#0a0a0a background, #e11d48 accent)

## Tech Stack

### Bridge (Node.js)
- Baileys (@whiskeysockets/baileys) - WhatsApp connection
- Axios - HTTP client for backend communication
- QR Code Terminal - QR code display for authentication

### Backend (Python/FastAPI)
- FastAPI - REST API with WebSocket support
- sentence-transformers - Local HuggingFace embeddings
- ChromaDB - Local vector database
- Requests - HuggingFace API calls
- WebSockets - Real-time activity streaming

### Frontend (React 16)
- React 16 - Plain JavaScript (no TypeScript)
- Recharts - Data visualization
- Axios - HTTP client
- WebSocket - Live activity feed

## Setup Instructions

### Prerequisites
- Node.js 14+
- Python 3.8+
- HuggingFace API token (free tier)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd arachnobot/backend
```

Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your HuggingFace API key:
```
HUGGINGFACE_API_KEY=your_huggingface_token_here
FASTAPI_URL=http://localhost:8000
```

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Bridge Setup

Navigate to the bridge directory:
```bash
cd arachnobot/bridge
```

Install dependencies:
```bash
npm install
```

Set environment variable for backend URL:
```bash
export FASTAPI_URL=http://localhost:8000  # On Windows: set FASTAPI_URL=http://localhost:8000
```

Start the bridge:
```bash
node index.js
```

**QR Code Scan**: A QR code will appear in the terminal. Scan it with WhatsApp on your phone to connect the bot.

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd arachnobot/frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

Open `http://localhost:3000` in your browser to access the dashboard.

## Usage

### WhatsApp Bot Interaction

1. **First Message**: Send any message to ArachnoBot
2. **Menu Options**: Reply with numbers 1-5:
   - **1️⃣ Search**: Search your chat history
   - **2️⃣ Summarize**: Get conversation summaries
   - **3️⃣ Find**: Locate specific messages
   - **4️⃣ Ask**: General questions about chats
   - **5️⃣ Help**: View help information

### Example Flow

```
You: (any message)
ArachnoBot: 🕷️ ArachnoBot here! What do you need? 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣

You: 1
ArachnoBot: 🔍 What are you looking for?

You: pizza recipe from Sara
ArachnoBot: 📍 Found it! Sara sent this on March 12: [recipe details]
```

### Dashboard Features

- **Dashboard**: Live activity feed, stats cards, recent queries
- **Knowledge Base**: View indexed contacts, search chunks, re-index
- **Bot Settings**: Change bot name, status, avatar, behavior toggles
- **Analytics**: Charts for messages per day, query types, response times

## File Structure

```
arachnobot/
├── bridge/
│   ├── index.js          # Baileys WhatsApp connection
│   ├── messageHandler.js # Menu flow handlers
│   ├── sessionStore.js   # Session management
│   ├── avatar.png        # Spider-bot pixel art (256x256)
│   └── package.json
├── backend/
│   ├── main.py           # FastAPI application
│   ├── embedder.py       # HuggingFace embeddings
│   ├── retriever.py      # ChromaDB search
│   ├── llm.py            # Mistral-7B API calls
│   ├── sync.py           # Chat sync pipeline
│   ├── memory.py         # Per-user memory
│   ├── stats.py          # Analytics tracking
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   ├── index.css
    │   └── components/
    │       ├── Dashboard.js
    │       ├── Dashboard.css
    │       ├── KnowledgeBase.js
    │       ├── KnowledgeBase.css
    │       ├── BotSettings.js
    │       ├── BotSettings.css
    │       ├── Analytics.js
    │       └── Analytics.css
    └── package.json
```

## API Endpoints

- `POST /sync` - Sync chat history from bridge
- `POST /chat` - RAG query with filters
- `POST /summarize` - Summarize conversation
- `GET /stats` - Get bot statistics
- `GET /contacts` - List indexed contacts
- `GET /contacts/{name}/chunks` - Get contact chunks
- `POST /contacts/{name}/reindex` - Re-index contact
- `GET /settings` - Get bot settings
- `POST /settings` - Update bot settings
- `POST /bot/toggle` - Toggle bot online/offline
- `WebSocket /ws/activity` - Live activity stream
- `GET /health` - Health check

## Environment Variables

```
HUGGINGFACE_API_KEY=your_huggingface_token
FASTAPI_URL=http://localhost:8000
```

## Notes

- **Avatar**: Place a 256x256 PNG spider-themed pixel art in `bridge/avatar.png`
- **ChromaDB**: Data persists to `backend/chroma_db/`
- **Session**: WhatsApp session stored in `bridge/session/`
- **Memory**: Per-user conversation memory cleared after 30 minutes
- **Retry Logic**: HuggingFace 503 errors auto-retry 3 times with 20s delay
- **Typing Indicator**: Always shows 1.5s before reply
- **Spider-Web CSS**: Decorative patterns on all card corners

## Troubleshooting

- **QR Code not appearing**: Check bridge dependencies and backend URL
- **Embedding fails**: Verify Python dependencies and disk space
- **LLM errors**: Check HuggingFace API key in `.env`
- **WebSocket disconnect**: Dashboard auto-reconnects every 5s
- **Avatar not updating**: Requires bridge restart after file change

## License

MIT

## 🕷️ ArachnoBot - Your AI Assistant on WhatsApp
