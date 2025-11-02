# Overview

This is a furniture arrangement game built as a full-stack web application. The project allows users to interactively drag, drop, and rotate furniture items within a virtual room, with the ability to save and load room layouts. The application features a React-based frontend with 3D graphics capabilities and an Express backend with PostgreSQL database support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, built using Vite as the build tool and development server.

**UI Component Library**: Radix UI primitives with custom styling through Tailwind CSS. The application uses a comprehensive design system with pre-built components (buttons, cards, dialogs, etc.) following consistent styling patterns.

**State Management**: Zustand is used for client-side state management with multiple stores:
- `useFurnitureGame` - Manages furniture items, drag states, and layout persistence
- `useGame` - Handles game phase transitions (ready, playing, ended)
- `useAudio` - Controls audio playback and mute state

**3D Graphics**: React Three Fiber ecosystem (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) for rendering 3D content, though the main game appears to use 2D canvas-based rendering.

**Data Fetching**: TanStack Query (React Query) for server state management and API communication.

**Styling**: Tailwind CSS with custom theme configuration supporting dark mode and CSS custom properties for theming.

## Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript support.

**Development Setup**: Uses `tsx` for development with hot reloading, and `esbuild` for production builds.

**API Structure**: RESTful API design with routes prefixed with `/api`. The routes are registered through a centralized `registerRoutes` function.

**Storage Layer**: Abstracted storage interface (`IStorage`) with a memory-based implementation (`MemStorage`). This allows for easy swapping between in-memory storage and database-backed storage without changing application code.

**Session Management**: Includes `connect-pg-simple` for PostgreSQL-backed session storage, indicating session-based authentication capability.

**Development Tooling**: Custom Vite integration in development mode with runtime error overlay support.

## Data Storage

**Database**: PostgreSQL using Neon serverless database (`@neondatabase/serverless`).

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Schema Location**: Database schema defined in `shared/schema.ts`, allowing both client and server to share type definitions.

**Current Schema**: Includes a `users` table with username/password authentication fields.

**Migration Strategy**: Schema changes managed through Drizzle Kit with migrations stored in the `./migrations` directory.

**Local Storage**: Client-side persistence using browser localStorage for saving furniture arrangements and other game state.

## External Dependencies

**Database Service**: Neon PostgreSQL serverless database, configured via `DATABASE_URL` environment variable.

**Font Provider**: Fontsource for the Inter font family, loaded locally rather than from external CDN.

**Build Tools**:
- Vite for frontend bundling and development server
- esbuild for backend production builds
- PostCSS with Tailwind CSS and Autoprefixer

**Asset Support**: GLSL shader support via `vite-plugin-glsl`, and asset handling for 3D models (`.gltf`, `.glb`) and audio files (`.mp3`, `.ogg`, `.wav`).

**Development Dependencies**:
- TypeScript for type checking
- Replit-specific runtime error modal plugin for enhanced developer experience

**No External APIs**: The application currently doesn't integrate with third-party APIs beyond the database connection.