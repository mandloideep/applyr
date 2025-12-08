# Applyr - System Architecture

## Overview

Applyr is a self-hosted, AI-powered job application management system with three main layers:

1. **Data Collection** - Chrome Extension
2. **Automation** - N8N Workflows
3. **Management** - Dashboard (React + Express + MongoDB)

## System Flow Diagram

```mermaid
flowchart TB
    subgraph Internet["Public Internet"]
        JB[Job Boards<br/>LinkedIn, Indeed, etc.]
        Gmail[Gmail API]
        GitHub[GitHub API]
        OpenAI[OpenAI API]
        Claude[Claude API]
    end

    subgraph CF["Cloudflare Tunnel"]
        Webhook[webhooks.opendx.dev]
    end

    subgraph Tailscale["Private Network (Tailscale)"]
        subgraph Docker["Docker Compose"]
            N8N[N8N<br/>:5678]
            Mongo[(MongoDB<br/>:27017)]
            CFD[Cloudflared]
        end

        subgraph Host["Host Services"]
            API[Express API<br/>:5000]
            Web[React Dashboard<br/>:3000]
        end
    end

    subgraph Browser["User's Browser"]
        Ext[Chrome Extension]
        Dashboard[Dashboard UI]
    end

    %% User flows
    JB --> Ext
    Ext -->|Save Job| API
    Dashboard <--> API

    %% API connections
    API <--> Mongo
    API -->|Trigger Workflow| N8N
    N8N -->|Update Results| API

    %% External APIs
    N8N --> OpenAI
    N8N --> Claude
    N8N --> Gmail
    N8N --> GitHub

    %% Webhook flow
    Gmail -->|Webhook| Webhook
    GitHub -->|Webhook| Webhook
    Webhook --> CFD
    CFD --> N8N

    %% Tailscale access
    Ext -.->|via Tailscale IP| API
    Dashboard -.->|via Tailscale IP| API
```

## Network Architecture

```mermaid
flowchart LR
    subgraph Public["Public Access"]
        CF[Cloudflare Tunnel<br/>webhooks.opendx.dev]
    end

    subgraph Private["Private Access (Tailscale)"]
        N8N[N8N Editor<br/>100.94.217.108:5678]
        API[Backend API<br/>100.94.217.108:5000]
        Web[Frontend<br/>100.94.217.108:3000]
        Mongo[MongoDB<br/>localhost:27017]
    end

    CF -->|Only webhooks| N8N

    MacBook[MacBook] -.->|Tailscale| Private
    Phone[Phone] -.->|Tailscale| Private
    Desktop[Desktop] -.->|localhost| Private
```

## Component Interaction

### Job Saving Flow

```mermaid
sequenceDiagram
    participant User
    participant Ext as Chrome Extension
    participant API as Express API
    participant DB as MongoDB
    participant N8N as N8N Workflow
    participant AI as OpenAI/Claude

    User->>Ext: Click "Save Job"
    Ext->>Ext: Scrape job details
    Ext->>API: POST /api/jobs
    API->>DB: Save job (status: new)
    API->>N8N: Trigger job-analysis webhook
    API-->>Ext: Job saved (id: xxx)

    N8N->>DB: Fetch user profile
    N8N->>AI: Analyze job match
    AI-->>N8N: Match score + analysis
    N8N->>API: POST /api/webhooks/job-analyzed
    API->>DB: Update job with analysis
    API-->>User: Notification: "Job analyzed!"
```

### Resume Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Dashboard
    participant API as Express API
    participant N8N as N8N Workflow
    participant GitHub as GitHub API
    participant AI as Claude
    participant Typst as Typst Compiler

    User->>Web: Click "Generate Resume"
    Web->>API: POST /api/resumes/generate
    API->>N8N: Trigger resume-generation webhook

    N8N->>API: Fetch base resume
    N8N->>API: Fetch job details
    N8N->>GitHub: Fetch recent projects
    N8N->>AI: Generate tailored content
    AI-->>N8N: Resume content (markdown)
    N8N->>Typst: Compile to PDF
    Typst-->>N8N: PDF file
    N8N->>API: POST /api/webhooks/resume-ready
    API->>API: Store PDF
    API-->>Web: Resume ready (download link)
    Web-->>User: "Resume ready!"
```

### Email Monitoring Flow

```mermaid
sequenceDiagram
    participant Gmail as Gmail
    participant CF as Cloudflare Tunnel
    participant N8N as N8N Workflow
    participant LLM as Local LLM
    participant API as Express API
    participant DB as MongoDB

    Note over N8N: Cron: Every 15 minutes
    N8N->>Gmail: Fetch new emails
    Gmail-->>N8N: New emails list

    loop For each email
        N8N->>LLM: Classify email
        LLM-->>N8N: Category + Summary
        N8N->>API: POST /api/webhooks/email-classified
        API->>DB: Store email with metadata

        alt Is Interview Request
            API->>N8N: Trigger interview-prep webhook
        end
    end
```

## Directory Structure

```
applyr/
├── apps/
│   ├── web/                    # React Dashboard
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── routes/         # TanStack Router pages
│   │   │   ├── lib/            # Utilities, API client
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── stores/         # Context/Zustand stores
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── api/                    # Express Backend
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── models/         # MongoDB models
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Auth, validation
│   │   │   ├── webhooks/       # N8N webhook handlers
│   │   │   └── lib/            # Utilities
│   │   └── package.json
│   │
│   └── extension/              # Chrome Extension
│       ├── src/
│       │   ├── background/     # Service worker
│       │   ├── content/        # Content scripts
│       │   ├── popup/          # Popup UI (React)
│       │   └── lib/            # Shared utilities
│       ├── public/
│       │   └── manifest.json
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared code
│       ├── src/
│       │   ├── types/          # TypeScript types
│       │   ├── schemas/        # Zod schemas
│       │   └── utils/          # Shared utilities
│       └── package.json
│
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── typst.Dockerfile        # For resume compilation
│
├── templates/
│   ├── resumes/                # Resume templates
│   │   ├── modern.typ          # Typst template
│   │   └── classic.md          # Markdown template
│   └── cover-letters/
│       └── professional.md
│
├── docs/                       # Documentation
├── .claude/                    # Claude Code context
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── .env
```

## Port Assignments

| Service         | Port  | Access                                 |
| --------------- | ----- | -------------------------------------- |
| React Dashboard | 3000  | Tailscale                              |
| Express API     | 5000  | Tailscale                              |
| N8N             | 5678  | Tailscale + Cloudflare (webhooks only) |
| MongoDB         | 27017 | localhost only                         |

## Security Model

```mermaid
flowchart TB
    subgraph Public["Public Internet"]
        Attacker[Potential Attacker]
    end

    subgraph CF["Cloudflare"]
        Tunnel[Tunnel<br/>webhooks.opendx.dev]
        WAF[WAF/DDoS Protection]
    end

    subgraph TS["Tailscale Network"]
        You[Your Devices]
        Services[All Services]
    end

    Attacker -->|Blocked| Services
    Attacker -->|Only webhooks| WAF
    WAF --> Tunnel
    Tunnel -->|/webhook/* only| Services
    You -->|Full access| Services
```

### Access Control

- **MongoDB**: No port exposed, internal Docker network only
- **N8N Editor**: Tailscale only (private IP)
- **Dashboard**: Tailscale only
- **API**: Tailscale only
- **Webhooks**: Cloudflare tunnel with path restrictions

### Authentication

- **Dashboard**: Better-auth with email/password + OTP
- **API**: JWT tokens from Better-auth
- **Extension**: Stores JWT, connects via Tailscale
- **N8N Webhooks**: Shared secret header validation

---

## Learning History Flow

```mermaid
sequenceDiagram
    participant User
    participant Ext as Chrome Extension
    participant API as Express API
    participant DB as MongoDB
    participant N8N as N8N Workflow
    participant LLM as Local LLM (transformer.js)

    User->>Ext: Click "Save Learning"
    Ext->>Ext: Capture URL, title, metadata
    Ext->>API: POST /api/learning
    API->>DB: Save learning (status: saved)
    API->>N8N: Trigger learning-analysis webhook
    API-->>Ext: Learning saved (id: xxx)

    Note over N8N,LLM: LOCAL AI ONLY - No external APIs
    N8N->>LLM: Summarize content
    LLM-->>N8N: Summary
    N8N->>LLM: Extract key points
    LLM-->>N8N: Key points
    N8N->>LLM: Suggest tags & category
    LLM-->>N8N: Tags + Category
    N8N->>API: POST /api/webhooks/learning-analyzed
    API->>DB: Update learning with analysis
    API-->>User: Notification: "Learning analyzed!"
```

## Content Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Dashboard
    participant API as Express API
    participant DB as MongoDB
    participant N8N as N8N Workflow
    participant AI as Claude/OpenAI

    User->>Web: Select learnings + Generate Content
    Web->>API: POST /api/social-posts/generate
    API->>DB: Fetch selected learnings
    API->>N8N: Trigger content-generation webhook

    N8N->>N8N: Combine & synthesize learnings
    N8N->>AI: Generate LinkedIn post
    N8N->>AI: Generate Twitter thread
    N8N->>AI: Generate Instagram script
    N8N->>AI: Generate TikTok script
    AI-->>N8N: Structured content for each platform

    N8N->>API: POST /api/webhooks/content-generated
    API->>DB: Store draft posts
    API-->>Web: Content ready!
    Web-->>User: "4 drafts ready for review"
```

## Local LLM Architecture

```mermaid
flowchart TB
    subgraph N8N["N8N Workflows"]
        W4[Email Monitoring]
        W9[Learning Analysis]
    end

    subgraph LocalService["Local LLM Service (:3001)"]
        API[Express API]
        Models[Transformer.js Models]
    end

    subgraph ModelStore["Available Models"]
        M1[DistilBERT - Classification]
        M2[BART-CNN - Summarization]
        M3[MiniLM - Embeddings]
        M4[Flan-T5 - General]
    end

    W4 & W9 -->|HTTP| API
    API --> Models
    Models --> ModelStore

    Note1[Privacy: All email/learning<br/>content stays local]
```

**Key Privacy Points:**

- Email content NEVER leaves local network
- Learning content analyzed locally via transformer.js
- Only non-sensitive metadata sent to cloud APIs
- User can choose which local model to use per task
