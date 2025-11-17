# 88Away Repository - Quick Inspection Summary

**Date:** October 28, 2025  
**Full Report:** See [REPOSITORY_INSPECTION.md](./REPOSITORY_INSPECTION.md)

---

## What is 88Away?

**Enterprise Romance Publishing Platform** - An AI-powered collaborative writing platform designed specifically for romance authors, publishers, and agencies.

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **TypeScript Files** | ~160 |
| **Primary Language** | TypeScript |
| **Frontend Framework** | React 18 |
| **Backend Framework** | Express.js |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Drizzle |
| **AI Integration** | OpenAI GPT-4/GPT-5 |
| **Authentication** | Replit Auth (OIDC) |
| **Payment Processing** | Stripe |

---

## Key Technologies

### Frontend Stack
- React 18 + TypeScript
- Wouter (routing)
- TanStack Query (server state)
- Zustand (client state)
- Shadcn/UI + Radix UI
- Tailwind CSS
- TipTap (rich text editor)

### Backend Stack
- Express.js
- Drizzle ORM
- Neon PostgreSQL
- WebSocket (real-time collaboration)
- OpenAI API
- Brevo (email/SMS)
- Stripe API

---

## Core Feature Categories

### 1. Writing Tools
- Multi-project management
- Rich text editor with collaboration
- Character database
- Worldbuilding entries
- Visual timeline

### 2. Romance-Specific
- Series management
- Trope tracking
- Heat level manager
- Character relationship mapper
- Dialogue coach
- Tension builder

### 3. AI Assistants
- **Romance Muse** - Creative scene generation
- **Romance Editor** - Genre-aware editing
- **Romance Coach** - Story structure guidance

### 4. Publishing Pipeline
- Cover design studio
- Blurb generator
- KDP publisher (Amazon integration)
- Metadata optimizer
- Multi-format export (TXT, DOCX, PDF, EPUB, MOBI, AZW3)

### 5. Enterprise Features
- Client portfolio management
- Revenue analytics
- Team collaboration
- Subscription management
- Marketplace integration

---

## Database Overview

**30+ Tables** including:
- Core: users, projects, documents, characters
- Romance: romanceSeries, romanceTropes, characterRelationships
- Publishing: coverDesigns, bookBlurbs, kdpMetadata
- Enterprise: clientPortfolios, revenueEntries
- Collaboration: projectCollaborators, documentVersions, notifications

---

## API Endpoints

**100+ API endpoints** organized by feature:
- Authentication & user management
- Projects, documents, characters
- AI generation & analysis
- OCR & expert modes
- Publishing & KDP integration
- Subscription & payments
- Marketplace operations
- Email & SMS communication
- Search & analytics

---

## Subscription Tiers

| Plan | Price | AI Sessions | Projects | Collaborators |
|------|-------|-------------|----------|---------------|
| **Free** | $0 | 20/month | 1 | 0 |
| **Starter** | $15/mo | 100/month | 3 | 3 |
| **Professional** | $29/mo | 500/month | 5 | 15 |
| **Enterprise** | $99/mo | Unlimited | Unlimited | Unlimited |

---

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type checking
npm run check

# Database migration
npm run db:push

# Production build
npm run build

# Start production
npm start
```

---

## Architecture Highlights

✅ **Type-Safe** - End-to-end TypeScript with Drizzle + Zod  
✅ **Real-Time** - WebSocket + Y.js CRDT for collaboration  
✅ **Scalable** - Serverless PostgreSQL (Neon)  
✅ **Secure** - OIDC auth, role-based access, Stripe webhooks  
✅ **AI-Powered** - OpenAI GPT-4/5 integration  
✅ **Monetized** - Stripe subscriptions + marketplace  
✅ **Domain-Focused** - Romance-specific features throughout  

---

## Documentation Available

1. **REPOSITORY_INSPECTION.md** - Full detailed inspection (this analysis)
2. **replit.md** - System architecture & features
3. **MONETIZATION_IMPLEMENTATION.md** - Subscription & revenue details
4. **OCR_DOCUMENTATION.md** - OCR & expert modes
5. **docs/PRODUCTION_RUNBOOK.md** - Deployment guide
6. **docs/ROMANCE_PLATFORM_GUIDE.md** - Romance features guide

---

## Project Maturity

**Status:** Production-Ready

**Strengths:**
- Modern, well-architected codebase
- Comprehensive feature set
- Type-safe throughout
- Good documentation
- Enterprise-grade collaboration features
- Domain-specific (romance) focus

**Next Steps:**
- Expand test coverage
- Complete production deployment
- Enhance mobile experience

---

## Quick Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│              Client (React + Vite)              │
│  ┌──────────┬───────────┬──────────────────┐  │
│  │  Pages   │ Components│  Hooks & Stores  │  │
│  └──────────┴───────────┴──────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP + WebSocket
┌──────────────────┴──────────────────────────────┐
│          Server (Express + Node.js)             │
│  ┌──────────────────────────────────────────┐  │
│  │  Routes │ Services │ Middleware │ Auth   │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
    ┌────▼───┐ ┌──▼────┐ ┌─▼──────┐
    │ Neon   │ │OpenAI │ │ Stripe │
    │ (DB)   │ │(AI)   │ │ (Pay)  │
    └────────┘ └───────┘ └────────┘
```

---

## Conclusion

88Away is a sophisticated, production-ready platform that effectively combines modern web technologies with domain-specific (romance publishing) features. The architecture is sound, type-safe, and built for scale. The romance-specific features demonstrate deep understanding of the target market.

**Overall Rating:** ⭐⭐⭐⭐⭐ Enterprise-Grade

---

*For complete details, see [REPOSITORY_INSPECTION.md](./REPOSITORY_INSPECTION.md)*
