# 88Away Repository Inspection Report

**Generated:** October 28, 2025  
**Repository:** ReeseAstor/88Away  
**Branch:** copilot/inspect-repository-structure

---

## Executive Summary

88Away is a comprehensive **Enterprise Romance Publishing Platform** built with modern web technologies. It's an AI-powered collaborative writing platform specifically designed for romance authors, publishers, and agencies. The platform combines advanced AI writing assistance, genre-specific tools, publishing pipeline automation, and marketplace functionality to create a complete romance publishing ecosystem.

---

## Repository Structure

```
88Away/
├── client/                 # React frontend application
│   └── src/
│       ├── components/     # UI components (including romance-specific)
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utility libraries
│       ├── stores/        # State management (Zustand)
│       └── assets/        # Static assets
├── server/                # Express.js backend
│   ├── expert-modes/      # Domain-specific OCR processing
│   └── *.ts              # Server modules and services
├── shared/                # Shared code between client/server
│   ├── schema.ts         # Database schema (Drizzle ORM)
│   └── utils.ts          # Shared utilities
├── tests/                 # End-to-end tests
├── docs/                  # Documentation
├── nginx/                 # Nginx configuration
├── attached_assets/       # Static assets
└── .github/              # GitHub Actions workflows

Total TypeScript Files: ~160
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** 
  - TanStack Query v5 (server state & caching)
  - Zustand (global client state)
- **UI Components:** 
  - Shadcn/UI + Radix UI (accessible primitives)
  - Tailwind CSS v3 (utility-first styling)
  - Lucide React (icons)
- **Rich Text Editor:** TipTap with extensions
  - Code block support (lowlight)
  - Text alignment
  - Underline
  - Starter kit
- **Additional Libraries:**
  - React Hook Form + Zod (form handling & validation)
  - Recharts (data visualization)
  - Framer Motion (animations)
  - Date-fns (date utilities)
  - DnD Kit (drag and drop)

### Backend
- **Framework:** Express.js with TypeScript
- **Database:** 
  - Neon (serverless PostgreSQL)
  - Drizzle ORM v0.39 (type-safe ORM)
  - Drizzle Kit (migrations)
- **Authentication:** 
  - Replit Auth (OIDC-based)
  - Passport.js with local strategy
  - Express Session
- **Real-time:** WebSocket (ws library) for collaboration
- **AI Integration:** OpenAI API (GPT-4/GPT-5)
- **Email Service:** Brevo (formerly Sendinblue)
- **SMS Service:** Brevo SMS API
- **Payment Processing:** Stripe + Stripe Marketplace
- **OCR:** Tesseract.js + OpenAI GPT-4 Vision
- **Document Processing:**
  - Puppeteer (PDF generation)
  - html-pdf-node
  - docx (Word documents)
  - archiver (ZIP files)

### Collaboration & Real-time
- **Y.js:** CRDT for real-time collaborative editing
- **y-prosemirror:** ProseMirror integration
- **WebSocket:** Real-time communication

### Development Tools
- **Build Tool:** Vite 5
- **TypeScript:** 5.6.3
- **Package Manager:** npm
- **Code Bundler:** esbuild (for server)
- **Replit Plugins:**
  - Cartographer (dev navigation)
  - Dev Banner
  - Runtime Error Modal

---

## Core Features

### 1. Writing & Content Management
- **Projects:** Multi-project management with genres
- **Documents:** Rich text editing with version control
- **Characters:** Comprehensive character database with romance-specific fields
- **Worldbuilding:** Organized worldbuilding entries
- **Timeline:** Visual timeline with drag-and-drop events

### 2. Romance-Specific Tools
- **Series Management:** Multi-book romance series tracking
- **Trope Tracker:** Romance trope management with conflict detection
- **Heat Level Manager:** Spice level consistency tracking
- **Character Relationship Mapper:** Romantic dynamics visualization
- **Dialogue Coach:** Character voice & romantic dialogue improvement
- **Tension Builder:** Romantic/sexual tension analysis
- **Romance Archetypes:** Alpha, beta, cinnamon roll characters

### 3. AI Assistant Ecosystem
Three specialized AI personas powered by OpenAI:
- **Romance Muse:** Creative scene generation for romantic content
- **Romance Editor:** Genre-aware editing with trope analysis
- **Romance Coach:** Story structure guidance for romance conventions

AI capabilities include:
- Content generation
- Writing style analysis
- Plot consistency checking
- Character development analysis
- Narrative flow analysis

### 4. Publishing Pipeline
- **Cover Design Studio:** Romance-optimized cover creation
- **Blurb Generator:** AI-powered marketing copy
- **KDP Publisher:** Direct Amazon KDP integration
- **Metadata Optimizer:** Romance keyword/category optimization
- **Multiple Export Formats:** TXT, DOCX, PDF, EPUB, MOBI, AZW3

### 5. OCR & Expert Modes
Domain-specific text extraction from images:
- **Academic:** Scholarly writing with citation preservation
- **Finance:** Financial documents with numerical precision
- **Law:** Legal documents with statute references
- **Marketing:** Brand names and CTA preservation

### 6. Collaboration Features
- **Role-Based Access Control:**
  - Owner (full control)
  - Editor (edit content)
  - Reviewer (comment only)
  - Reader (view only)
- **Real-time Editing:** Multiple users editing simultaneously
- **Notifications:** Real-time project activity notifications
- **Activity Feed:** Comprehensive project activity logging
- **Comments:** Document commenting system

### 7. Enterprise Features
- **Client Portfolio Management:** Agency/publisher client tracking
- **Revenue Analytics:** Multi-client financial tracking & ROI
- **Subscription Plans:** Free, Starter, Professional, Enterprise
- **Usage Limits:** AI sessions, projects, collaborators
- **Team Collaboration:** Multi-user access control

### 8. Marketplace Integration
- **Stripe Marketplace:** Direct book sales
- **Revenue Sharing:** Automated payment distribution
- **Connected Accounts:** Seller account management
- **Fee Calculation:** Platform fee tracking

### 9. Additional Features
- **Prompt Library:** 1000+ curated writing prompts
  - 10 categories (Character Development, Plot, Dialogue, etc.)
  - Search & filtering
  - Favorites system
  - One-click AI integration
- **Global Search:** Multi-table search across content
- **Email Management:** Brevo-powered transactional emails
- **SMS Management:** Brevo SMS messaging
- **Analytics Dashboard:** Writing progress & statistics
- **Writing Streaks:** Track productive writing days
- **Word Count Tracking:** Consistent calculation across platform

---

## Database Schema

### Core Tables
- **users** - User accounts with Stripe integration
- **sessions** - Session storage for authentication
- **projects** - Writing projects with romance fields
- **documents** - Chapters/content with versioning
- **characters** - Character database with romance archetypes
- **worldbuildingEntries** - Worldbuilding content
- **timelineEvents** - Timeline events with ordering
- **projectCollaborators** - Team member access

### Romance-Specific Tables
- **romanceSeries** - Multi-book series management
- **romanceTropes** - Trope tracking with conflicts
- **characterRelationships** - Romantic relationship dynamics
- **coverDesigns** - Book cover designs
- **bookBlurbs** - Marketing copy versions
- **kdpMetadata** - Amazon KDP publishing data

### Enterprise Tables
- **clientPortfolios** - Agency client management
- **revenueEntries** - Financial tracking
- **aiGenerations** - AI usage tracking

### Communication Tables
- **emails** - Email tracking & history
- **sms** - SMS message tracking
- **notifications** - User notifications
- **activities** - Project activity log

### Collaboration Tables
- **documentComments** - Document comments
- **documentBranches** - Version control branches
- **documentVersions** - Document version history
- **branchMergeEvents** - Merge tracking

### Other Tables
- **writingPrompts** - Prompt library content
- **ocrRecords** - OCR processing history

### Key Enums
- **roleEnum:** owner, editor, reviewer, reader
- **characterRoleEnum:** protagonist, antagonist, supporting, minor, other
- **romanceHeatLevelEnum:** sweet, warm, steamy, scorching
- **romanceSubgenreEnum:** contemporary, historical, paranormal, fantasy, etc.
- **publicationStatusEnum:** draft, in_progress, ready_for_review, approved, formatted, published, archived
- **relationshipTypeEnum:** romantic_interest, ex_lover, family, friend, rival, etc.

---

## API Architecture

### Authentication
- `/api/auth/user` - Get current user
- `/api/auth/logout` - Logout

### Projects
- `/api/projects` - CRUD operations
- `/api/projects/:id/collaborators` - Manage team members
- `/api/projects/:id/stats` - Project statistics

### Documents
- `/api/projects/:projectId/documents` - Document management
- `/api/documents/:id/versions` - Version history
- `/api/documents/:id/branches` - Branch management

### Characters, Worldbuilding, Timeline
- `/api/projects/:projectId/characters` - Character management
- `/api/projects/:projectId/worldbuilding` - Worldbuilding entries
- `/api/projects/:projectId/timeline` - Timeline events

### AI Features
- `/api/ai/muse` - Creative content generation
- `/api/ai/editor` - Content editing
- `/api/ai/coach` - Writing guidance
- `/api/ai/analyze/style` - Style analysis
- `/api/ai/analyze/plot` - Plot consistency
- `/api/ai/analyze/character` - Character development
- `/api/ai/analyze/narrative` - Narrative flow

### OCR & Expert Modes
- `/api/ocr/extract` - Text extraction from images
- `/api/ocr/batch` - Batch OCR processing
- `/api/ocr/history` - OCR history
- `/api/expert-modes` - Available expert modes
- `/api/expert-modes/validate` - Text validation
- `/api/expert-modes/enhance` - Text enhancement

### Publishing & KDP
- `/api/kdp/validate` - Validate KDP metadata
- `/api/kdp/publish` - Publish to KDP
- `/api/kdp/metadata/:projectId` - KDP metadata management
- `/api/export/:projectId` - Export documents

### Subscription & Payments
- `/api/subscription` - Subscription management
- `/api/subscription/plans` - Available plans
- `/api/subscription/create` - Create subscription
- `/api/subscription/cancel` - Cancel subscription
- `/api/subscription/portal` - Billing portal
- `/api/subscription/usage/:limitType` - Usage limits
- `/api/subscription/webhook` - Stripe webhooks

### Marketplace
- `/api/marketplace/connect` - Connect Stripe account
- `/api/marketplace/products` - Product management
- `/api/marketplace/checkout` - Create checkout
- `/api/marketplace/analytics/:sellerId` - Sales analytics
- `/api/marketplace/refund` - Process refunds

### Revenue & Analytics
- `/api/romance/revenue` - Revenue tracking
- `/api/revenue/analytics` - Detailed analytics
- `/api/revenue/by-project/:projectId` - Project revenue
- `/api/revenue/export` - Export revenue data

### Communication
- `/api/emails` - Email management
- `/api/emails/send` - Send email
- `/api/emails/batch` - Batch send
- `/api/emails/schedule` - Schedule email
- `/api/sms` - SMS management
- `/api/sms/send` - Send SMS
- `/api/sms/batch` - Batch SMS

### Search & Discovery
- `/api/search` - Global search
- `/api/prompts` - Prompt library
- `/api/prompts/favorites` - Favorite prompts

### Notifications & Activity
- `/api/notifications` - User notifications
- `/api/activities/:projectId` - Project activity feed

---

## Subscription Plans

### Free Tier
- 20 AI generations/month
- 1 project
- No collaborators
- Basic export formats

### Starter ($15/month)
- 100 AI generations/month
- 3 projects
- 3 collaborators per project
- Standard export formats

### Professional ($29/month)
- 500 AI generations/month
- 5 projects
- 15 collaborators per project
- All export formats
- Priority support

### Enterprise ($99/month)
- Unlimited AI generations
- Unlimited projects
- Unlimited collaborators
- All export formats
- Priority support
- Advanced analytics
- Custom branding
- API access

---

## External Dependencies & Services

### Required Services
1. **Neon Database** - PostgreSQL database hosting
2. **OpenAI API** - GPT-4/GPT-5 for AI features
3. **Stripe** - Payment processing & subscriptions
4. **Brevo API** - Email and SMS services
5. **Replit Auth** - OIDC authentication

### Required Environment Variables
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
BREVO_API_KEY=...
REPLIT_DOMAINS=...
REPL_ID=...
SESSION_SECRET=...
CLIENT_URL=http://localhost:3000
```

---

## Development & Deployment

### Development
```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run check      # Type checking
npm run db:push    # Push database schema
```

### Production Build
```bash
npm run build      # Build client + server
npm start          # Start production server
```

### Docker Deployment
- **Production Compose:** `docker-compose.production.yml`
- **Services:** romance-platform, job-queue, analytics, AI service
- **Nginx:** Reverse proxy configuration included

### CI/CD
GitHub Actions workflows:
1. **Jekyll Pages** - GitHub Pages deployment
2. **NPM Publish** - Package publishing on release
3. **Google Cloud** - GKE deployment (template)

---

## Testing Infrastructure

### Test Files
1. **e2e-publishing-workflow.test.ts** - End-to-end Playwright tests
2. **romance-ai-integration.test.ts** - AI integration tests
3. **romance-components.test.tsx** - Component tests
4. **test-analysis.ts** - OpenAI analysis testing

### Test Framework
- Playwright for E2E testing
- Test utilities for romance workflow testing

---

## Key Design Decisions

1. **Monorepo Structure:** Client and server in single repository
2. **Shared Schema:** TypeScript types shared between frontend/backend
3. **Type Safety:** Drizzle ORM + Zod for end-to-end type safety
4. **Real-time Collaboration:** Y.js CRDT for conflict-free editing
5. **Role-Based Access:** Granular permission system
6. **AI Safety:** Content filtering for appropriate generation
7. **Consistent Word Counting:** HTML stripping + entity decoding
8. **Optimistic UI Updates:** Immediate feedback with background sync
9. **Event Sourcing:** Activity logging for audit trails
10. **Serverless Database:** Neon for scalability

---

## Security Features

1. **Authentication:** OIDC-based Replit Auth
2. **Session Management:** Secure express-session with PostgreSQL
3. **Webhook Verification:** Stripe signature validation
4. **Usage Limits:** Server-side enforcement
5. **Access Control:** Row-level security via user ownership
6. **Input Validation:** Zod schemas for all inputs
7. **SQL Injection Prevention:** Parameterized queries via Drizzle
8. **XSS Prevention:** HTML sanitization in rich text editor

---

## Performance Optimizations

1. **Query Caching:** TanStack Query for client-side caching
2. **Debounced Search:** 300ms delay for search inputs
3. **Lazy Loading:** Code splitting with dynamic imports
4. **Optimistic Updates:** UI updates before server confirmation
5. **Database Indexing:** Strategic indexes on foreign keys
6. **Connection Pooling:** Neon serverless connection pooling
7. **Asset Optimization:** Vite build optimization
8. **Memoization:** React hooks for expensive computations

---

## Documentation

### Available Documents
1. **replit.md** - Comprehensive system architecture & features
2. **MONETIZATION_IMPLEMENTATION.md** - Subscription & revenue features
3. **OCR_DOCUMENTATION.md** - OCR & expert mode details
4. **docs/PRODUCTION_RUNBOOK.md** - Production deployment guide
5. **docs/ROMANCE_PLATFORM_GUIDE.md** - Romance platform features

---

## Code Quality Metrics

- **Total TypeScript Files:** ~160
- **Architecture:** Clean separation of concerns
- **Type Coverage:** Comprehensive TypeScript usage
- **Code Organization:** Well-structured modules
- **Naming Conventions:** Consistent and descriptive
- **Error Handling:** Try-catch blocks with proper logging

---

## Future Enhancements (from docs)

### OCR
- Medical, technical, scientific expert modes
- PDF multi-page processing
- Handwriting recognition
- Formula parsing
- Language translation
- Custom terminology dictionaries

### Platform
- Additional AI personas
- More export formats
- Enhanced analytics
- Mobile app
- API for third-party integrations
- White-label solutions

---

## Project Maturity Assessment

### Strengths
✅ Modern technology stack  
✅ Comprehensive feature set  
✅ Type-safe architecture  
✅ Real-time collaboration  
✅ AI integration  
✅ Payment processing  
✅ Enterprise features  
✅ Good documentation  
✅ Romance-specific focus  

### Areas for Growth
⚠️ Test coverage could be expanded  
⚠️ Some workflows have template/placeholder code  
⚠️ Production deployment could be further documented  
⚠️ Mobile responsiveness may need testing  

---

## Conclusion

88Away is a sophisticated, feature-rich platform specifically built for the romance publishing industry. It combines modern web technologies, AI capabilities, and domain-specific tools to create a comprehensive ecosystem for romance authors and publishers. The codebase demonstrates good architectural decisions, type safety, and scalability considerations.

The platform is production-ready with proper authentication, payment processing, and collaboration features. The romance-specific features (tropes, heat levels, relationship mapping) show deep understanding of the target market.

**Overall Assessment:** Enterprise-grade, well-architected platform with strong foundation for continued growth.

---

**Inspection Completed:** October 28, 2025  
**Inspector:** GitHub Copilot Coding Agent
