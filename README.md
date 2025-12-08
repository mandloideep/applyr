# Applyr - AI-Powered Job Application System

A self-hosted, open-source job application management system that uses AI to automate and streamline your entire job search process. Built with privacy in mind - your data stays on your hardware.

## Features

### Job Management

- **Chrome Extension**: Save jobs from LinkedIn, Indeed, Greenhouse, Lever with one click
- **AI Job Analysis**: Automatic match scoring based on your skills and preferences
- **Kanban Pipeline**: Track jobs through stages (New → Applied → Interview → Offer)
- **Smart Filtering**: Search and filter by score, company, status, tags

### Resume & Cover Letters

- **AI-Tailored Resumes**: Generate job-specific resumes using your base resume + GitHub projects
- **Cover Letter Generation**: Personalized cover letters with company research
- **Typst Templates**: Professional PDF output with version tracking

### Email Intelligence (Privacy-First)

- **Local AI Processing**: All email analysis runs on your machine via transformer.js
- **Smart Classification**: Automatically categorize emails (interview, rejection, offer, etc.)
- **Summaries & Actions**: Extract key points and action items from emails
- **Application Linking**: Auto-link emails to job applications

### Learning History (NEW)

- **Capture Learnings**: Save blog posts, YouTube videos, courses, documentation you learn from
- **AI Analysis**: Auto-summarize, extract key points, suggest tags
- **Combine & Synthesize**: Merge multiple learnings into content themes
- **Content Generation**: Create posts for LinkedIn, X, Instagram, TikTok from what you learn

### Social Content Generation

- **Multi-Platform**: LinkedIn posts, X threads, Instagram captions, TikTok scripts
- **Structured Scripts**: Hook, body, key points, CTA, delivery notes
- **Source Flexibility**: Generate from GitHub activity, learnings, or combined sources
- **Draft Management**: Store, edit, approve, schedule, publish

### Interview Preparation

- **Company Research**: Auto-fetch news, reviews, culture info
- **LeetCode Suggestions**: Relevant problems based on role
- **Behavioral Prep**: STAR method answer templates
- **System Design Topics**: Role-specific preparation materials

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Frontend   | React, TanStack Router/Query, shadcn/ui, Tailwind    |
| Backend    | Express.js, MongoDB, Better-Auth                     |
| Extension  | WXT (Manifest V3), React                             |
| Automation | N8N (self-hosted)                                    |
| Local AI   | Transformer.js (email classification, summarization) |
| Cloud AI   | Claude/OpenAI (content generation, resume tailoring) |
| Resume     | Typst (PDF generation)                               |
| Network    | Tailscale (private), Cloudflare Tunnel (webhooks)    |

## Project Roadmap

### Phase 1: Foundation

- [x] Monorepo setup (pnpm workspaces)
- [x] Docker Compose (MongoDB, N8N, Cloudflared)
- [x] Tailscale private network configuration
- [x] Cloudflare tunnel for webhooks
- [ ] Environment configuration

### Phase 2: Core Backend

- [ ] Express.js API scaffold
- [ ] Better-Auth integration
- [ ] MongoDB models (users, jobs, applications)
- [ ] Webhook handlers for N8N
- [ ] Internal API for N8N workflows

### Phase 3: Dashboard Frontend

- [ ] React + Vite setup
- [ ] TanStack Router (file-based routing)
- [ ] Auth UI (login, signup, session)
- [ ] Dashboard home with stats
- [ ] Jobs list and Kanban board

### Phase 4: Chrome Extension

- [ ] WXT project setup
- [ ] Job scraping (LinkedIn, Indeed)
- [ ] Learning capture functionality
- [ ] Popup UI with preview
- [ ] API integration via Tailscale

### Phase 5: Job AI Pipeline

- [ ] N8N Workflow: Job Analysis
- [ ] N8N Workflow: Resume Generation
- [ ] N8N Workflow: Cover Letter Generation
- [ ] Typst template integration
- [ ] GitHub project integration

### Phase 6: Email Intelligence

- [ ] Gmail API integration
- [ ] Transformer.js setup (local models)
- [ ] N8N Workflow: Email Monitoring
- [ ] Email classification & summarization
- [ ] Dashboard email inbox view

### Phase 7: Learning History

- [ ] Learning capture in extension
- [ ] N8N Workflow: Learning Analysis
- [ ] Dashboard learning management
- [ ] Combine/synthesize learnings
- [ ] Tag and category system

### Phase 8: Content Generation

- [ ] N8N Workflow: Content from Learnings
- [ ] Multi-platform templates (LinkedIn, X, Instagram, TikTok)
- [ ] Structured script generation
- [ ] Content calendar UI
- [ ] Draft approval workflow

### Phase 9: Interview Preparation

- [ ] N8N Workflow: Company Research
- [ ] N8N Workflow: Interview Prep Generation
- [ ] LeetCode problem suggestions
- [ ] Behavioral question generator
- [ ] Dashboard prep view

### Phase 10: Polish & Launch

- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Error handling & logging
- [ ] Documentation completion
- [ ] Demo video & launch

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
├─────────────────────────────────────────────────────────────────┤
│  Chrome Extension              │        Dashboard (React)        │
│  - Save Jobs                   │        - Manage Jobs            │
│  - Save Learnings              │        - View Applications      │
│  - Quick Preview               │        - Content Calendar       │
└──────────┬─────────────────────┴──────────────┬─────────────────┘
           │                                     │
           │         Tailscale (Private)         │
           ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js API (:5000)                       │
│  - Authentication (Better-Auth)                                  │
│  - REST Endpoints                                                │
│  - Webhook Handlers                                              │
└──────────┬─────────────────────┬────────────────────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────┐   ┌─────────────────────────────────────────┐
│  MongoDB (:27017) │   │           N8N (:5678)                   │
│  - Users          │   │  - Job Analysis Workflow                │
│  - Jobs           │   │  - Resume Generation Workflow           │
│  - Applications   │   │  - Email Monitoring Workflow            │
│  - Emails         │   │  - Learning Analysis Workflow           │
│  - Learnings      │   │  - Content Generation Workflow          │
│  - Social Posts   │   │  - Interview Prep Workflow              │
└──────────────────┘   └─────────┬───────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐
          │   Local LLM     │       │   Cloud APIs    │
          │ (transformer.js)│       │ (Claude/OpenAI) │
          │                 │       │                 │
          │ - Email Class.  │       │ - Resume Gen    │
          │ - Summarization │       │ - Cover Letters │
          │ - Learning Anal.│       │ - Content Gen   │
          └─────────────────┘       └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm 9.x
- Docker & Docker Compose
- Tailscale account
- Cloudflare account (for tunnel)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/applyr.git
cd applyr
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:

```bash
# MongoDB
MONGO_PASSWORD=your-secure-password

# N8N
N8N_USER=admin
N8N_PASSWORD=your-password

# Tailscale
TAILSCALE_IP=100.x.x.x  # Get from: tailscale ip -4

# Cloudflare
CLOUDFLARE_TUNNEL_TOKEN=your-token

# Auth
JWT_SECRET=your-jwt-secret

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
```

### 3. Start Infrastructure

```bash
# Start MongoDB, N8N, Cloudflared
docker compose up -d

# Verify
docker compose ps
```

### 4. Start Development

```bash
# Start all apps
pnpm dev

# Or individually
pnpm --filter @applyr/api dev
pnpm --filter @applyr/web dev
```

### 5. Access Services

| Service    | URL                             | Access    |
| ---------- | ------------------------------- | --------- |
| Dashboard  | http://[TAILSCALE_IP]:3000      | Tailscale |
| API        | http://[TAILSCALE_IP]:5000      | Tailscale |
| N8N Editor | http://[TAILSCALE_IP]:5678      | Tailscale |
| Webhooks   | https://webhooks.yourdomain.com | Public    |

## Project Structure

```
applyr/
├── apps/
│   ├── api/                 # Express.js backend
│   ├── web/                 # React dashboard
│   └── extension/           # Chrome extension
├── packages/
│   └── shared/              # Shared types & schemas
├── docs/                    # Documentation
│   ├── API.md               # API specification
│   ├── ARCHITECTURE.md      # System architecture
│   ├── DATABASE.md          # MongoDB schemas
│   ├── DEVELOPMENT.md       # Development guide
│   ├── N8N_WORKFLOWS.md     # Workflow documentation
│   ├── STEP_BY_STEP_GUIDE.md # Implementation guide
│   └── TECH_STACK.md        # Technology details
├── docker/                  # Dockerfiles
├── templates/               # Resume & cover letter templates
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## Privacy Philosophy

Applyr is designed with privacy as a core principle:

1. **Self-Hosted**: All services run on your hardware
2. **Local AI for Sensitive Data**: Emails processed by transformer.js locally
3. **Private Network**: Dashboard accessible only via Tailscale
4. **No Tracking**: No analytics or telemetry sent externally
5. **Your Data, Your Control**: Export everything, delete anytime

## Contributing

Contributions are welcome! Please read the [Development Guide](docs/DEVELOPMENT.md) first.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- [N8N](https://n8n.io) - Workflow automation
- [Tailscale](https://tailscale.com) - Private networking
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [TanStack](https://tanstack.com) - React libraries
- [Better-Auth](https://better-auth.com) - Authentication
- [Typst](https://typst.app) - Document preparation

---

Built with AI assistance. Your job search, automated.
