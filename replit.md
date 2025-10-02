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
- 📋 Task 8: Export system (PDF, Word)
- 📋 Task 9: Onboarding flow for new users
- 📋 Task 10: Writing progress dashboard
- 📋 Task 11: Character database UX improvements
- 📋 Task 12: Timeline visualization enhancements

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