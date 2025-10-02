# Overview

88Away is a collaborative writing platform that combines AI-powered assistance with comprehensive story bible management. The application provides three specialized AI personas (Muse for creative inspiration, Editor for polishing, and Coach for planning) to help writers manage projects, characters, worldbuilding, timelines, and documents. It features role-based collaboration with Owner, Editor, Reviewer, and Reader permissions, along with Stripe-based subscription management and comprehensive analytics dashboards for tracking writing progress and team collaboration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Wouter**: Lightweight client-side routing instead of React Router
- **TanStack Query**: Server state management and caching for API interactions
- **Zustand**: Global client state management for UI state like sidebar collapse and current project
- **Shadcn/UI + Radix**: Comprehensive component library built on Radix primitives
- **Tailwind CSS**: Utility-first styling with custom design tokens and CSS variables
- **TipTap**: Rich text editor for document editing with extensible plugin architecture

## Backend Architecture
- **Express.js**: RESTful API server with middleware for request logging and error handling
- **TypeScript**: End-to-end type safety with shared schemas between client and server
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Neon Database**: PostgreSQL serverless database with connection pooling
- **OpenAI Integration**: GPT-5 model integration for three AI personas with safety filtering

## Authentication & Authorization
- **Replit Auth**: OIDC-based authentication with session management
- **Role-Based Access Control**: Four permission levels (Owner, Editor, Reviewer, Reader) for project collaboration
- **Session Storage**: PostgreSQL-backed session storage with configurable TTL

## AI System Design
- **Three Personas**: Muse (creative), Editor (polish), Coach (planning) with distinct prompt engineering
- **Safety Framework**: Content filtering to block explicit material and ensure age-appropriate content
- **Structured Outputs**: JSON responses for outlines and structured content with token tracking
- **Context Management**: Project-aware AI with access to characters, worldbuilding, and timeline data

## Data Architecture
- **Shared Schema**: TypeScript types shared between client and server using Drizzle schema definitions
- **Document Versioning**: Full version history tracking for collaborative editing
- **Relational Design**: Normalized database structure with proper foreign key relationships
- **Migration System**: Drizzle Kit for database schema migrations and updates

## Development Workflow
- **Vite**: Fast development server with HMR and optimized production builds
- **ESBuild**: Server-side bundling for production deployment
- **TypeScript Compilation**: Strict type checking across the entire stack
- **Path Aliases**: Clean import structure with @ aliases for components and shared code

# Known Issues & Roadmap

## Critical Bugs (Phase 1 - Resolved)
1. ✅ **WebSocket SessionID Fixed**: WebSocket now extracts sessionId from httpOnly cookie - real-time collaboration working
2. ✅ **Missing API Endpoints Fixed**: PUT/DELETE endpoints for worldbuilding and timeline implemented with proper validation
3. ⚠️ **Vite Server Disconnects**: Known infrastructure issue - `server/vite.ts` error handler causes HMR reconnects every 2-3 seconds (protected file, requires platform fix)
4. ✅ **Authentication 401s**: Confirmed as expected behavior for unauthenticated users - working correctly

## Phase 1 Development Tasks (12 Total)
- ✅ Task 1: Audit application for critical bugs
- ✅ Task 1a-1d: Fix critical bugs (WebSocket auth, missing API endpoints, error handling)
- ✅ Task 2: Enhanced document editor (10+ formatting options, autosave indicator)
- ✅ Task 3: Project templates (Novel, Screenplay, Short Story with pre-populated content)
- ✅ Task 4: Word count tracking (real-time display, project aggregation, goal progress)
- ✅ Task 5: AI context awareness (character/worldbuilding/timeline data auto-injected into AI prompts)
- ✅ Task 6: Refined AI system prompts (enhanced with context usage, structure, safety)
- ✅ Task 7: AI usage analytics (token tracking, subscription-based limits, enforcement, enhanced visualizations)
- ✅ Task 8: Export system (JSON, HTML, PDF, ePub, Word/DOCX with proper TipTap formatting preservation)
- ✅ Task 9: Onboarding flow (welcome modal, 5-step checklist with auto-tracking, database-backed progress)
- ✅ Task 10: Writing progress dashboard (streak tracking, weekly/monthly statistics, productive day analysis)
- ✅ Task 11: Character database UX improvements (filtering, sorting, grid/list toggle, enhanced cards)
- ✅ Task 12: Timeline visualization enhancements (drag-and-drop event reordering, cross-year dragging)

**Phase 1 Progress**: 12/12 tasks complete (100%) - COMPLETE

## Phase 2 Development Tasks (In Progress)
- ✅ Task 1: Legal Pages Implementation
  - ✅ Privacy Policy page with 9 comprehensive sections
  - ✅ Terms and Conditions page with 13 comprehensive sections
  - ✅ Cookie Policy page with 8 sections and detailed cookie table
  - ✅ Footer component with links to all legal pages
  - ✅ Public routes for legal pages (/privacy, /terms, /cookies)

**Phase 2 Progress**: 1/1 tasks complete (100%) for initial legal compliance

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **OpenAI API**: GPT-5 model access for AI content generation
- **Stripe**: Payment processing and subscription management
- **Replit Auth**: OIDC authentication service

## UI Framework
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool with React plugin and development server
- **Drizzle Kit**: Database migration and introspection tools
- **TypeScript**: Static type checking and compilation

# Design Decisions

## Word Count Calculation
The application uses standard word counting methodology (follows Microsoft Word/Google Docs conventions):
- **Shared Logic**: `shared/utils.ts` provides `calculateWordCount()` used by both client and server
- **HTML Processing**: Strips HTML tags, decodes common entities (&nbsp;, &mdash;, etc.)
- **Splitting**: Uses whitespace-only splitting (standard practice)
- **Examples**:
  - "Hello—world" (em dash, no spaces) = 1 word (compound)
  - "Hello — world" (em dash with spaces) = 2 words
  - "Hello&nbsp;world" = 2 words (non-breaking space decoded)
- **Consistency**: Client (editor display) and server (storage) use identical logic
- **Aggregation**: Project word count = sum of all document word counts (updated on each document save)

## Onboarding System
The application provides a multi-stage onboarding flow for new users:
- **Database-Backed**: Progress stored in `users.onboardingProgress` JSONB field for multi-device support
- **Welcome Modal**: 4-slide carousel introducing platform features (skip/complete → `welcomeShown: true`)
- **Getting Started Checklist**: 5-step task list with auto-tracking:
  1. Create first project (auto-detected when projects exist)
  2. Use AI assistant (auto-detected when AI generations exist)
  3. Add character (marked on character creation)
  4. View analytics (marked on analytics page visit)
  5. Try export (marked on successful export)
- **Single Source of Truth**: Checklist visibility based solely on `onboardingProgress.tourCompleted` (not `user.hasCompletedOnboarding`)
- **Auto-Completion**: When all 5 steps complete, system automatically marks `tourCompleted: true` and updates `hasCompletedOnboarding: true`
- **Step Handlers**: Distributed across dashboard, characters page, analytics page, and export menu
- **Cache Invalidation**: Mutations invalidate both `/api/user/onboarding` and `/api/auth/user` to keep UI in sync

## Writing Progress Dashboard
The dashboard provides comprehensive writing analytics with streak tracking and productivity insights:
- **Streak Calculation**: Analyzes document version history to identify consecutive days with >0 word delta
- **Three Streak Types**: Current streak (active), longest streak (all-time record), last active (most recent writing day)
- **Statistics**: Weekly and monthly word counts with percentage change indicators
- **Productive Day Analysis**: Identifies the weekday with highest average word count across all documents
- **Data Sources**: Combines document updates, version history, and AI usage for holistic progress view
- **Visualization**: Enhanced analytics charts showing AI token usage over time with daily/weekly/monthly breakdowns

## Character Database
The character database features advanced organization and filtering capabilities:
- **Metadata**: Role (protagonist/antagonist/supporting/minor/other), importance (1-5 star scale), custom tags array
- **Filtering**: Client-side filtering by role dropdown and text search across name/description/notes/tags
- **Sorting**: Multiple sort options (alphabetical by name, creation date, last updated) with ascending/descending toggle
- **View Modes**: Grid view (cards with badges/stars/chips) and list view (compact rows) with localStorage persistence
- **Enhanced Cards**: Visual badges for roles, star rating display for importance, tag chips with color coding
- **User Preference**: View mode selection persists across sessions for better UX

## Timeline Visualization
The timeline provides drag-and-drop event management with proper persistence and security:
- **Drag-and-Drop**: @dnd-kit integration with mouse, touch, and keyboard sensors for accessibility
- **orderIndex Field**: Integer field in timelineEvents table providing deterministic event ordering
- **Reorder Algorithm**: Array-based approach using splice to remove/insert, then resequence all events with contiguous indices
- **Cross-Year Dragging**: Automatically updates event date when dragged to different year/era
- **Security**: Project ownership verification prevents cross-project event manipulation
- **Atomicity**: Database transactions ensure data consistency during multi-event resequencing
- **Optimistic UI**: Immediate visual feedback with automatic rollback on error
- **Visual Feedback**: Drag handles with GripVertical icon, drag overlay, and drop zone indicators

## Legal Pages
The application provides comprehensive legal documentation accessible to all users:
- **Public Routes**: Privacy (/privacy), Terms (/terms), and Cookie (/cookies) pages accessible without authentication
- **Footer Integration**: Global footer component with links to all legal pages, visible on every page
- **Privacy Policy**: 9 sections covering data collection, usage, security, third-party services (Stripe, OpenAI, Neon), cookies, user rights (GDPR), children's privacy, policy changes, and contact
- **Terms and Conditions**: 13 sections covering acceptance, service description, accounts, payments, IP rights, AI-generated content disclaimers, user conduct, privacy, termination, liability, disputes, changes, and contact
- **Cookie Policy**: 8 sections covering cookie definitions, usage, types (Essential, Functional, Analytics), third-party cookies, management, duration, changes, and contact
- **Cookie Table**: Detailed table showing 5 specific cookies (connect.sid session, theme_preference, editor_settings, user_preferences, analytics_id) with purposes and durations
- **Consistent Design**: All pages use shadcn/ui Card components, responsive layouts (max-w-4xl), dark mode support, and professional typography
- **Navigation**: Each page includes "Back to Home" button for easy return to application