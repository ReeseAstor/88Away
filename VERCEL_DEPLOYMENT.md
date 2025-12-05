# Vercel Deployment Guide for 88Away

This document provides instructions for deploying 88Away to Vercel.

## Prerequisites

- A Vercel account
- A Neon PostgreSQL database (or compatible PostgreSQL database)
- Required API keys and environment variables

## Environment Variables

Configure the following environment variables in your Vercel project settings:

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (from Neon or another provider)
- `SESSION_SECRET` - A secure random string for session management
- `NODE_ENV` - Set to `production`

### Optional Variables

- `REPLIT_DOMAINS` - Domain configuration (optional for Vercel)
- `REPL_ID` - Application ID (optional)
- `OPENAI_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payment processing
- `BREVO_API_KEY` - For email services
- Any other API keys your application requires

## Deployment Steps

### Method 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project and set environment variables

### Method 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables in the project settings
5. Deploy

## Build Configuration

The project includes optimized build settings in `vercel.json`:

- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist/public`
- **Node.js Runtime**: Configured for serverless functions
- **Cache Headers**: Optimized for static assets

## Performance Optimizations

The following optimizations have been implemented:

1. **Code Splitting**: The bundle is split into vendor chunks:
   - `react-vendor`: React and routing libraries
   - `ui-vendor`: Radix UI components
   - `editor-vendor`: TipTap editor
   - `query-vendor`: TanStack Query
   - `utils`: Utility libraries

2. **Minification**: Production builds use Terser for JavaScript minification with:
   - Console statements removed
   - Debugger statements removed

3. **Static Asset Caching**: Assets are cached with long-term cache headers (1 year)

4. **Security Headers**: Added security headers including:
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

## Important Notes

### WebSocket Support

This application uses WebSockets for real-time features. Vercel has limitations with WebSockets in serverless functions. Consider:

1. Using Vercel's Edge Functions for WebSocket support (requires code changes)
2. Using a separate WebSocket service (e.g., Ably, Pusher)
3. Deploying the WebSocket server separately on a platform that supports persistent connections (e.g., Railway, Render)

### Database Migrations

Run database migrations before deploying:

```bash
npm run db:push
```

Ensure your `DATABASE_URL` environment variable is set before running migrations.

### Build Size

The current build produces:
- Main bundle: ~1.3 MB (minified)
- Total assets: ~2.8 MB

Consider implementing lazy loading for routes to further reduce initial bundle size.

## Troubleshooting

### Build Fails

- Ensure all environment variables are set
- Check that `DATABASE_URL` is accessible from Vercel
- Review build logs in Vercel dashboard

### Runtime Errors

- Check function logs in Vercel dashboard
- Ensure all required environment variables are set
- Verify database connectivity

### Performance Issues

- Enable Vercel Analytics to monitor performance
- Review bundle analysis and consider further code splitting
- Use Vercel Edge Network for better global performance

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
