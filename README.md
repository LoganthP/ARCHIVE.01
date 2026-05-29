# 🔬 Research Paper Tracker

AI-powered research paper management with **semantic search** using Google Gemini embeddings.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?logo=google)

---

## ✨ Features

- **📄 Paper Management** — Add, view, and delete research papers with full metadata
- **🧠 Semantic Search** — Find papers by meaning using Gemini text-embedding-004
- **✨ AI Summarization** — Generate concise summaries via Gemini 2.0 Flash
- **⚡ In-Memory Vector Store** — Pure JS cosine similarity (no native deps, deploys anywhere)
- **🎨 Modern Dark UI** — Glassmorphism design with smooth animations

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React + Vite                       │
│              (Tailwind CSS Dark UI)                  │
├──────────────────────────────────────────────────────┤
│                      │                               │
│         axios /api/* │  (proxy in dev)               │
│                      ▼                               │
├──────────────────────────────────────────────────────┤
│               Express API Server                     │
│    ┌──────────┬──────────┬──────────────────┐        │
│    │  Papers  │  Search  │   Summarize      │        │
│    │  CRUD    │  Route   │   Route          │        │
│    └────┬─────┴────┬─────┴────────┬─────────┘        │
│         │          │              │                  │
│    ┌────▼─────┐ ┌──▼──────────┐ ┌▼──────────────┐    │
│    │ SQLite   │ │ Vector Store│ │ Gemini API     │   │
│    │ (papers) │ │ (cosine sim)│ │ (embed + sum.) │   │
│    └──────────┘ └─────────────┘ └────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Setup

1. Get a free Groq API key at <https://console.groq.com>
2. Copy `.env.example` to `.env`
3. Add your key: `GROQ_API_KEY=your_key_here`
4. `cd server && npm install`
5. `cd ../client && npm install && npm run build`
6. `node server/index.js`

## AI Stack

- **Summarization**: Groq API (llama-3.3-70b-versatile) — ultra fast inference
- **Embeddings**: Local Xenova/all-MiniLM-L6-v2 — no API key required,
  runs in Node.js, 384-dimensional vectors, downloads once and caches

## 🔍 How Semantic Search Works

1. **Indexing**: When a paper is added, its title + abstract are sent to Gemini's `text-embedding-004` model with `RETRIEVAL_DOCUMENT` task type, generating a 768-dimensional vector
2. **Querying**: Search queries are embedded with `RETRIEVAL_QUERY` task type (optimized for search)
3. **Matching**: Cosine similarity is computed between the query vector and all document vectors
4. **Ranking**: Results are sorted by similarity score (0–100%) and returned

---

## 📡 API Endpoints

| Method | Endpoint              | Description                         |
|--------|-----------------------|-------------------------------------|
| POST   | `/api/papers`         | Add paper (auto-embeds via Gemini)  |
| GET    | `/api/papers`         | List papers (paginated)             |
| GET    | `/api/papers/:id`     | Get paper by ID                     |
| DELETE | `/api/papers/:id`     | Delete paper                        |
| POST   | `/api/search`         | Semantic search `{ query, topK }`   |
| POST   | `/api/papers/summarize/:id` | Summarize abstract via Gemini |
| GET    | `/api/health`         | Health check                        |

---

## 🚢 Deploy to Render

1. Push your code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repository
4. Render auto-detects `render.yaml` configuration
5. Add `GEMINI_API_KEY` as an environment variable
6. Deploy!

The build process:

- Installs server + client dependencies
- Builds the React app to `client/dist`
- Express serves the static files in production

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS        |
| Backend      | Node.js, Express                    |
| Database     | SQLite (better-sqlite3)             |
| Embeddings   | Google Gemini text-embedding-004    |
| Summarization| Google Gemini 2.0 Flash             |
| Vector Store | In-memory cosine similarity         |

---

## 📄 License

MIT
