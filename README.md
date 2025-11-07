# Room Arrange Game

An interactive furniture arrangement game where you can drag, drop, and rotate furniture items in a virtual room. Design your perfect space with various furniture pieces and save your layouts!

## Features

- 🪑 Drag and drop furniture items
- 🔄 Rotate furniture to find the perfect angle
- 💾 Save and load room layouts
- 🎨 Multiple room sizes to choose from
- 🔊 Audio feedback for interactions
- 🎮 Intuitive canvas-based interface

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- PostgreSQL database (optional, for user authentication features)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd RoomArrangeGame
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (if using database):
```bash
# Create a .env file
DATABASE_URL=your_postgresql_connection_string
```

4. Push database schema (if using database):
```bash
npm run db:push
```

### Running the Game

#### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The game will be available at `http://localhost:5000`

#### Production Mode

Build and run the production version:

```bash
npm run build
npm start
```

The production server will run on port 5000.

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build both client and server for production
- `npm start` - Run production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle Kit

## Project Structure

```
RoomArrangeGame/
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/        # Utilities and stores
│   │   └── pages/      # Page components
│   └── public/         # Static assets
├── server/            # Express backend
│   ├── index.ts       # Server entry point
│   ├── routes.ts      # API routes
│   └── storage.ts     # Storage abstraction
├── shared/            # Shared types and schemas
│   └── schema.ts      # Database schema
└── dist/              # Production build output
```

## Technology Stack

### Frontend

- **React** with TypeScript
- **Vite** - Build tool and dev server
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Canvas API** - 2D rendering for game

### Backend

- **Express.js** - Web server framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (via Neon serverless)

### Development Tools

- **tsx** - TypeScript execution for development
- **esbuild** - Fast production builds
- **Drizzle Kit** - Database migrations

## Architecture

### Frontend Architecture

The frontend uses React with a component-based architecture. State is managed through Zustand stores:

- `useFurnitureGame` - Manages furniture items, drag states, and layout persistence
- `useGame` - Handles game phase transitions
- `useAudio` - Controls audio playback and mute state

The game interface is rendered using HTML5 Canvas for smooth 2D graphics and interactions.

### Backend Architecture

The backend is built with Express.js and follows a RESTful API design. Routes are prefixed with `/api` and registered through a centralized `registerRoutes` function.

The storage layer uses an abstracted `IStorage` interface, allowing easy swapping between in-memory storage and database-backed storage.

### Database

The application uses PostgreSQL with Drizzle ORM for type-safe database queries. The schema is defined in `shared/schema.ts`, allowing both client and server to share type definitions.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT

