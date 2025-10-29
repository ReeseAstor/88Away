# 88Away Directory Structure

```
88Away/
├── .github/                      # GitHub Actions workflows
│   └── workflows/
│       ├── jekyll-gh-pages.yml  # Jekyll GitHub Pages deployment
│       ├── npm-publish.yml       # NPM package publishing
│       └── google.yml            # Google Cloud GKE deployment
│
├── attached_assets/              # User-uploaded assets and images
│   └── *.{jpeg,png,psd,txt}     # Various media files
│
├── client/                       # Frontend React application
│   ├── src/
│   │   ├── assets/              # Static assets (images, fonts, etc.)
│   │   ├── components/          # React components
│   │   │   ├── romance/         # Romance-specific components
│   │   │   │   ├── blurb-generator.tsx
│   │   │   │   ├── character-relationship-mapper.tsx
│   │   │   │   ├── client-portfolio.tsx
│   │   │   │   ├── cover-design-studio.tsx
│   │   │   │   ├── dialogue-coach.tsx
│   │   │   │   ├── heat-level-manager.tsx
│   │   │   │   ├── kdp-publisher.tsx
│   │   │   │   ├── metadata-optimizer.tsx
│   │   │   │   ├── revenue-analytics.tsx
│   │   │   │   └── roi-calculator.tsx
│   │   │   └── ui/              # Shadcn/UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── pages/               # Page components
│   │   │   ├── analytics.tsx
│   │   │   ├── characters.tsx
│   │   │   ├── cookies.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── emails.tsx
│   │   │   ├── landing.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── privacy.tsx
│   │   │   ├── project.tsx
│   │   │   ├── prompt-library.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── sms.tsx
│   │   │   ├── subscription.tsx
│   │   │   ├── terms.tsx
│   │   │   ├── timeline.tsx
│   │   │   └── worldbuilding.tsx
│   │   ├── stores/              # Zustand state management
│   │   ├── App.tsx              # Main App component
│   │   ├── index.css            # Global styles
│   │   └── main.tsx             # Entry point
│   └── index.html               # HTML template
│
├── docs/                         # Documentation
│   ├── PRODUCTION_RUNBOOK.md    # Production deployment guide
│   └── ROMANCE_PLATFORM_GUIDE.md # Romance features guide
│
├── nginx/                        # Nginx configuration
│   └── romance-platform.conf    # Reverse proxy config
│
├── server/                       # Backend Express.js application
│   ├── expert-modes/            # OCR expert mode processors
│   │   ├── academic.ts          # Academic text processing
│   │   ├── finance.ts           # Financial document processing
│   │   ├── law.ts               # Legal document processing
│   │   ├── marketing.ts         # Marketing copy processing
│   │   └── index.ts             # Expert modes index
│   ├── activities.ts            # Activity logging service
│   ├── analytics.ts             # Analytics service
│   ├── brevoService.ts          # Email service (Brevo API)
│   ├── brevoSmsService.ts       # SMS service (Brevo API)
│   ├── collaboration.ts         # Real-time collaboration (WebSocket)
│   ├── db.ts                    # Database connection (Drizzle)
│   ├── emailScheduler.ts        # Email scheduling service
│   ├── export-utils.ts          # Document export utilities
│   ├── index.ts                 # Server entry point
│   ├── kdp-integration.ts       # Amazon KDP integration
│   ├── languages.ts             # Language/locale support
│   ├── notifications.ts         # Notification service
│   ├── ocr.ts                   # OCR service
│   ├── ocrService.ts            # OCR processing
│   ├── openai.ts                # OpenAI API integration
│   ├── replitAuth.ts            # Replit authentication
│   ├── routes.ts                # API route definitions
│   ├── seed-prompts.ts          # Prompt library seeding
│   ├── storage.ts               # Data access layer
│   ├── stripe-marketplace.ts    # Stripe marketplace service
│   ├── subscription-middleware.ts # Subscription enforcement
│   ├── subscription-service.ts  # Subscription management
│   ├── templates.ts             # Email/document templates
│   └── vite.ts                  # Vite dev server integration
│
├── shared/                       # Shared code (client + server)
│   ├── schema.ts                # Database schema (Drizzle)
│   └── utils.ts                 # Shared utilities
│
├── tests/                        # Test files
│   ├── e2e-publishing-workflow.test.ts  # E2E Playwright tests
│   ├── romance-ai-integration.test.ts   # AI integration tests
│   └── romance-components.test.tsx      # Component tests
│
├── .env                          # Environment variables
├── .gitignore                   # Git ignore rules
├── .replit                      # Replit configuration
├── components.json              # Shadcn/UI config
├── docker-compose.production.yml # Production Docker setup
├── Dockerfile                   # Docker image definition
├── drizzle.config.ts           # Drizzle ORM configuration
├── package.json                # NPM dependencies
├── package-lock.json           # NPM lock file
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS config
├── test-analysis.ts            # OpenAI analysis test script
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
│
├── REPOSITORY_INSPECTION.md    # Comprehensive inspection report
├── INSPECTION_SUMMARY.md       # Quick summary
├── DIRECTORY_STRUCTURE.md      # This file
├── MONETIZATION_IMPLEMENTATION.md # Monetization details
├── OCR_DOCUMENTATION.md        # OCR feature documentation
└── replit.md                   # System architecture overview
```

## Key Directories Explained

### `/client/src/`
Frontend React application with TypeScript. Uses Vite for building, TanStack Query for data fetching, and Shadcn/UI for components.

### `/server/`
Backend Express.js API server. Handles authentication, database operations, AI integration, payments, and real-time collaboration.

### `/shared/`
Code shared between client and server, including the complete database schema defined using Drizzle ORM.

### `/client/src/components/romance/`
Romance-specific React components including cover design, KDP publishing, trope management, and analytics.

### `/server/expert-modes/`
Domain-specific OCR text processors for academic, finance, law, and marketing content.

### `/docs/`
Production deployment guides and feature documentation.

### `/tests/`
End-to-end and integration tests using Playwright.

## File Count by Type

- **TypeScript files (.ts, .tsx):** ~160
- **Configuration files:** 10+
- **Documentation files (.md):** 8+
- **Docker & deployment:** 3+

## Notable Files

- **server/routes.ts** - Central API route definitions (1000+ lines)
- **shared/schema.ts** - Complete database schema with 30+ tables
- **client/src/App.tsx** - Main application component with routing
- **server/openai.ts** - AI integration (Muse, Editor, Coach personas)
- **server/stripe-marketplace.ts** - Payment & marketplace logic
- **server/collaboration.ts** - Real-time collaborative editing
