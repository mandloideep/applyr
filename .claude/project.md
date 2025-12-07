# Applyr - Project Context

## What is Applyr?

Self-hosted, AI-powered job application management system. Combines Chrome extension (data collection), N8N (automation), and React dashboard (management).

## Tech Stack

- **Frontend**: React + Vite + TanStack (Router, Query, Form) + shadcn/ui
- **Backend**: Express.js + MongoDB + Better-auth
- **Extension**: React + WXT (Manifest V3)
- **Automation**: N8N (self-hosted)
- **Resume Gen**: Typst + Pandoc (PDF)
- **Language**: TypeScript throughout
- **Package Manager**: pnpm (monorepo)

## Project Structure

```
apps/
  web/        # React dashboard (port 3000)
  api/        # Express backend (port 5000)
  extension/  # Chrome extension WXT
packages/
  shared/     # Shared types, schemas, utils
```

## Key Services

| Service         | Port  | Access                            |
| --------------- | ----- | --------------------------------- |
| React Dashboard | 3000  | Tailscale                         |
| Express API     | 5000  | Tailscale                         |
| N8N             | 5678  | Tailscale + Cloudflare (webhooks) |
| MongoDB         | 27017 | localhost only                    |

## Network Setup

- **Private (Tailscale)**: All services accessible via 100.94.217.108
- **Public (Cloudflare)**: Only N8N webhooks via webhooks.opendx.dev

## Authentication

Better-auth with:

- Email/password
- OTP login
- JWT tokens for API

## Key Workflows (N8N)

1. Job Analysis - Match scoring with AI
2. Resume Generation - Tailored PDF via Typst
3. Cover Letter Generation
4. Email Monitoring - Gmail classification
5. GitHub Analysis - Activity insights
6. Interview Prep - Research + LeetCode
7. Social Content - LinkedIn/Twitter posts
8. Recruiter Outreach - Personalized messages

## Database Collections

users, jobs, applications, resumes, emails, interviewPrep, githubActivity, socialPosts, recruiterOutreach

## Development Commands

```bash
pnpm install          # Install deps
pnpm dev              # Start all in dev mode
pnpm build            # Build all
docker compose up -d  # Start infrastructure
```

## Important Files

- `docs/ARCHITECTURE.md` - System diagrams
- `docs/DATABASE.md` - MongoDB schemas
- `docs/API.md` - API endpoints
- `docs/N8N_WORKFLOWS.md` - Workflow guides
- `docs/DEVELOPMENT.md` - Dev setup

## Current Phase

Phase 1: Foundation - Setting up infrastructure, Docker, basic backend with auth.
