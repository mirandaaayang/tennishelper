# Overview

This is a headless tennis court booking automation bot built with Express.js and TypeScript. The system automatically books tennis courts at scheduled times using Playwright for web automation. The bot targets the Hamilton court as the primary preference and falls back to other courts if needed. It includes email and SMS notifications for booking results and uses a Twilio webhook to receive SMS verification codes during the booking process.

**Status**: Bot is fully implemented and running with SMS notifications enabled. All credentials configured.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Express.js Server**: RESTful API server with middleware for request logging and error handling
- **TypeScript**: Full TypeScript implementation across server, client, and shared code
- **Modular Services**: Separated concerns with dedicated service classes for tennis booking, email notifications, and Twilio SMS handling
- **Memory Storage**: In-memory data storage implementation with interface for potential database migration
- **Scheduled Automation**: Time-based scheduling system that automatically triggers booking attempts at 8 AM Pacific on weekdays

## Frontend Architecture
- **React with Vite**: Modern React setup with fast development builds
- **Headless Design**: Minimal frontend - the application is designed to run server-side with no user interface
- **Shadcn/ui Components**: Pre-built UI component library for potential future admin interface
- **TanStack Query**: Client-side data fetching and caching (ready for future use)

## Data Layer
- **Drizzle ORM**: Type-safe database toolkit configured for PostgreSQL
- **Schema Design**: Three main entities - users, booking attempts, and bot configuration
- **Interface Pattern**: Storage abstraction layer allowing easy migration from memory to database storage

## Automation Engine
- **Playwright Browser Automation**: Headless browser control for interacting with the tennis booking website
- **Court Priority System**: Configurable court preferences with Hamilton as primary target
- **Selector Configuration**: Centralized CSS selectors for website elements to handle UI changes
- **Pacific Timezone Handling**: Accurate scheduling based on Pacific timezone with DST awareness

## External Dependencies

- **Neon Database**: PostgreSQL serverless database (configured but not actively used - memory storage current)
- **Twilio SMS**: Webhook endpoint to receive SMS verification codes during booking process
- **Twilio SMS**: SMS notifications for booking success/failure sent to configured phone number
- **Playwright**: Browser automation for interacting with rec.us booking website
- **Replit Integration**: Development environment integration with runtime error overlay and cartographer