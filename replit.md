# Overview

88Away is an AI-powered collaborative writing platform designed to assist authors with project management, creative inspiration, and content refinement. It integrates specialized AI personas (Muse, Editor, Coach) to support various stages of the writing process, from idea generation to final edits. The platform also offers robust story bible management for characters, worldbuilding, and timelines, alongside real-time collaboration features with role-based access control (Owner, Editor, Reviewer, Reader). Business-wise, it targets the creative writing market with a subscription model (Stripe integration) and provides analytics for tracking progress and team contributions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Frameworks**: React with TypeScript for type safety.
- **Routing**: Wouter for client-side navigation.
- **State Management**: TanStack Query for server state and caching, Zustand for global client-side UI state.
- **UI/UX**: Shadcn/UI and Radix for components, Tailwind CSS for styling with custom design tokens.
- **Editor**: TipTap rich text editor for document creation with an extensible plugin architecture.

## Backend
- **Framework**: Express.js with TypeScript for RESTful API services.
- **Database**: Neon (serverless PostgreSQL) with Drizzle ORM for type-safe database interactions.
- **AI Integration**: OpenAI's GPT-5 model powers three distinct AI personas (Muse, Editor, Coach) with safety filtering and structured JSON outputs.

## Authentication & Authorization
- **Authentication**: Replit Auth (OIDC-based) for secure session management.
- **Authorization**: Role-Based Access Control with Owner, Editor, Reviewer, and Reader permission levels for collaborative projects.

## AI System
- **Personas**: Three distinct AI roles (Muse for creative, Editor for polishing, Coach for planning) driven by specialized prompt engineering.
- **Safety**: Content filtering integrated to ensure appropriate content generation.
- **Context Management**: AI models leverage project-specific data (characters, worldbuilding, timeline) for relevant suggestions.

## Data Management
- **Schema**: Shared TypeScript schemas between frontend and backend via Drizzle ORM.
- **Versioning**: Full document version history tracking for collaborative editing.
- **Structure**: Normalized relational database design with proper foreign key relationships.
- **Migrations**: Drizzle Kit for database schema evolution.

## Key Features & Design Decisions
- **Word Count**: Consistent client/server word count calculation, including HTML stripping and entity decoding.
- **Onboarding**: Database-backed, multi-stage onboarding flow with welcome modals and a trackable checklist.
- **Writing Progress Dashboard**: Analyzes writing streaks, weekly/monthly word counts, and identifies productive days.
- **Character Database**: Advanced organization with metadata (role, importance, tags), filtering, sorting, and view modes.
- **Timeline Visualization**: Drag-and-drop event management with `orderIndex` for persistence, cross-year dragging, and optimistic UI updates.
- **Legal Pages**: Publicly accessible Privacy Policy, Terms & Conditions, and Cookie Policy pages integrated into the application footer.
- **Notifications System**: Real-time, collaborative notifications for project activities, with recipient-specific delivery and read status tracking.
- **Activity Feed**: Comprehensive project activity logging visible to all collaborators, distinct from personal notifications.
- **Global Search**: Multi-table search functionality across documents, characters, worldbuilding, and timeline events with relevance ranking and access control.
- **Prompt Library**: Professional writing prompt library with 1008+ curated prompts across 10 categories (Character Development, Plot & Story Structure, Dialogue, Scene Writing, Worldbuilding, Editing, Genre-Specific, Ghostwriting, Marketing, Publishing Prep). Features search with debouncing, multi-dimensional filtering (category, persona, role, featured), favorites system, usage tracking, and one-click AI integration via Zustand store that pre-fills AI modal with prompt content and appropriate persona.

# External Dependencies

- **Neon Database**: Serverless PostgreSQL database hosting.
- **OpenAI API**: Provides GPT-5 models for AI content generation.
- **Stripe**: Handles payment processing and subscription management.
- **Replit Auth**: OIDC-based authentication service.
- **Radix UI**: Foundational accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database migration and introspection.
- **TypeScript**: Language for static type checking.