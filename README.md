<div align="center">

# 📚 ArchiveResearcher

### AI-Powered Research Discovery & Knowledge Intelligence Platform

<img src="https://img.shields.io/badge/AI-Powered-red?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Research-Intelligence-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js"/>
<img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript"/>
<img src="https://img.shields.io/badge/RAG-AI%20Search-purple?style=for-the-badge"/>

<br/>
<br/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=1A237E&height=260&section=header&text=ArchiveResearcher&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Next%20Generation%20Research%20Discovery%20Platform&descAlignY=58&descAlign=50"/>

</div>

---

# ✨ Overview

**ArchiveResearcher** is an AI-powered Research Intelligence Platform designed to help students, researchers, developers, and academics discover, analyze, understand, and interact with research papers using advanced Artificial Intelligence.

The platform combines:

- 📚 Research paper discovery
- 🔎 Semantic search and retrieval
- 🧠 AI-powered research analysis
- 🤖 RAG-based AI Chatbot
- 📊 Citation intelligence
- 📂 Research workspace management
- ⚡ Interactive research workflows

Unlike traditional research tools, ArchiveResearcher enables users to upload papers and directly chat with an AI assistant that answers questions using the actual content of uploaded research documents.
The result is a powerful research environment where users can explore, analyze, and converse with knowledge.

---

# 🚀 Core Features

## 📖 Research Discovery
- Search academic papers
- Research topic exploration
- Intelligent source discovery
- Multi-domain research support

## 🤖 AI Research Assistant
- Research summarization
- Concept explanations
- Paper understanding
- Literature review assistance

## 💬 RAG-Based AI Chatbot
- Chat with uploaded papers
- Context-aware responses
- Multi-document understanding
- Retrieval-Augmented Generation (RAG)
- Research Q&A
- Grounded AI responses

## 🔎 Semantic Search
- Context-aware retrieval
- Meaning-based search
- Similar paper discovery
- Intelligent document lookup

## 📊 Citation Intelligence
- Citation relationships
- Research influence mapping
- Paper connectivity analysis

## 📂 Research Workspace
- Save papers
- Organize collections
- Manage research sessions
- Research knowledge management

---

# 🧠 System Architecture

```mermaid
flowchart TD

    U[👤 Researcher]

    U --> A[⚛️ ArchiveResearcher Frontend]

    A --> B[📚 Paper Discovery]
    A --> C[🤖 AI Assistant]
    A --> D[💬 RAG Chatbot]
    A --> E[📂 Research Workspace]

    B --> F[🖥️ Backend API]
    C --> F
    D --> F
    E --> F

    F --> G[Research Processing Engine]

    G --> H[Paper Retrieval]
    G --> I[Citation Analysis]
    G --> J[Metadata Extraction]
    G --> K[Embedding Generation]

    H --> L[(Research Database)]
    I --> L
    J --> L

    K --> M[(Vector Database)]

    D --> N[Retriever]

    N --> M

    N --> O[Relevant Research Chunks]

    O --> P[Groq LLM]

    P --> Q[Grounded AI Response]

    Q --> A
```
---
# 💬 RAG Chat Architecture

```mermaid
flowchart LR

    A[Uploaded Research Papers]

    A --> B[Text Extraction]

    B --> C[Chunking]

    C --> D[Embedding Generation]

    D --> E[(Vector Database)]

    UserQuery --> F[Retriever]

    E --> F

    F --> G[Relevant Chunks]

    G --> H[Prompt Augmentation]

    H --> I[Groq LLM]

    I --> J[AI Response]

    J --> User
```
---

# ⚡ Research Workflow

```mermaid
sequenceDiagram

    participant User
    participant Frontend
    participant Backend
    participant VectorDB
    participant Groq

    User->>Frontend: Upload Research Paper

    Frontend->>Backend: Process Document

    Backend->>VectorDB: Store Embeddings

    User->>Frontend: Ask Question

    Frontend->>Backend: Chat Query

    Backend->>VectorDB: Retrieve Relevant Chunks

    VectorDB-->>Backend: Context

    Backend->>Groq: Query + Retrieved Context

    Groq-->>Backend: Grounded Response

    Backend-->>Frontend: AI Answer
```

---

# 🏗️ Technology Stack

| Technology | Purpose |
|------------|----------|
| React | Frontend Interface |
| TypeScript | Type Safety |
| Vite | Frontend Build Tool |
| Node.js | Backend Runtime |
| Express.js | API Services |
| Prisma | Database ORM |
| PostgreSQL | Research Metadata |
| Vector Database | Semantic Retrieval |
| Groq API | AI Research Assistant |
| RAG Pipeline | Context Retrieval |
| Embeddings | Semantic Search |
| WebSockets | Real-Time Updates |

---

# 📂 Project Structure

```bash
ArchiveResearcher/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application pages
│   │   ├── services/            # API integrations
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   │
│   ├── routes/
│   │   ├── auth.js              # Authentication APIs
│   │   ├── papers.js            # Paper upload & management
│   │   ├── search.js            # Semantic search endpoints
│   │   ├── chat.js              # RAG chatbot APIs
│   │   ├── profile.js           # User profile APIs
│   │   ├── settings.js          # User settings
│   │   ├── notifications.js     # Notification services
│   │   ├── support.js           # Support endpoints
│   │   └── apikeys.js           # API key management
│   │
│   ├── services/
│   │   ├── ai.js                # Groq AI integration
│   │   ├── vectorStore.js       # Embedding retrieval & storage
│   │   ├── textCleaner.js       # Document preprocessing
│   │   └── db.js                # Database layer
│   │
│   ├── package.json
│   └── .env
│
├── uploads/                     # Uploaded research papers
├── README.md
└── package.json
```

---

# 🌐 Research Intelligence Architecture

```mermaid
flowchart TD

    U[👤 Researcher]

    U --> A[⚛️ React Frontend]

    A --> B[📄 Paper Upload]
    A --> C[🔎 Semantic Search]
    A --> D[💬 RAG Chatbot]
    A --> E[🤖 AI Research Assistant]

    B --> F[🖥️ Express Backend]
    C --> F
    D --> F
    E --> F

    F --> G[Text Cleaner]

    G --> H[Vector Store]

    D --> I[Retriever]

    I --> H

    I --> J[Relevant Research Chunks]

    J --> K[Groq LLM]

    K --> L[Grounded AI Response]

    L --> A

    F --> M[(Research Database)]
```

---

# 📦 Deployment Architecture

```mermaid
flowchart TB

    subgraph USERS
        U1[👨‍🎓 Students]
        U2[👨‍🔬 Researchers]
        U3[👩‍💻 Developers]
    end

    subgraph FRONTEND
        F1[React + Vite Client]
        F2[Research Dashboard]
        F3[Knowledge Graph UI]
        F4[Paper Viewer]
    end

    subgraph BACKEND
        B1[Node.js API]
        B2[Research Engine]
        B3[Citation Processor]
        B4[Embedding Service]
    end

    subgraph DATABASES
        D1[(PostgreSQL)]
        D2[(Vector Database)]
    end

    subgraph AI
        A1[LLM Models]
        A2[Research Summarizer]
        A3[Semantic Search Models]
    end

    U1 --> F1
    U2 --> F1
    U3 --> F1

    F1 --> B1

    B1 --> B2
    B1 --> B3
    B1 --> B4

    B2 --> D1
    B3 --> D1

    B4 --> D2

    B1 --> A1
    A1 --> A2
    A1 --> A3
```

---

# 📊 Research Pipeline

```mermaid
flowchart LR

    A[Research Query]

    B[Semantic Search]

    C[Paper Retrieval]

    D[Citation Analysis]

    E[AI Summarization]

    F[Knowledge Extraction]

    G[Research Insights]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/LoganthP/ArchiveResearcher.git
```

---

## Install Dependencies

### Client Setup

```bash
cd client
npm install
npm run dev
```

---

### Server Setup

```bash
cd server
npm install
npm run dev
```

---

# 🔐 Environment Variables

## 🖥️ Server

Create a `.env` file inside the `server/` directory:

```env
GROQ_API_KEY="your-groq-api-key-here"
PORT=5000
NODE_ENV=development
```

### Environment Variables Explained

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | API key used for AI-powered research analysis and summarization |
| `PORT` | Server port number |
| `NODE_ENV` | Application environment (`development` or `production`) |

---

### Example Production Configuration

```env
GROQ_API_KEY="your-production-groq-api-key"
PORT=5000
NODE_ENV=production
```

---

# 📚 Research Features

| Feature | Status |
|---|---|
| Research Discovery | ✅ |
| AI Summaries | ✅ |
| Semantic Search | ✅ |
| Citation Analysis | ✅ |
| RAG Paper Chat | ✅ |
| Multi-Document Retrieval | ✅ |
| Research Notes | ✅ |
| Paper Organization | ✅ |
| Intelligent Retrieval | ✅ |

---

# 📈 Future Roadmap

- 📄 PDF Research Parsing Enhancements
- 🤖 Multi-Agent Research Assistants
- 📚 Automatic Literature Reviews
- 🔗 Cross-Paper Knowledge Linking
- 🧠 Long-Term Research Memory
- ☁️ Cloud Research Workspace
- 🎙️ Voice-Based Research Assistant
- 🌍 Multi-Language Research Support

---

# 🤝 Contributing

```bash
Fork → Clone → Develop → Commit → Push → Pull Request
```

Contributions are welcome!

---

# 📜 License

MIT License

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=1A237E&height=120&section=footer"/>

</div>
