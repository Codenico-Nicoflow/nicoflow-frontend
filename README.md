# Nicoflow Frontend

A modern task management application built with React, TypeScript, and Vite.

## Project Structure

```
nicoflow-frontend/
├── src/
│   ├── lib/              # Shared libraries (types, store, utils, constants)
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-based modules
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── layout/            # Layout components
│   └── ...
├── __tests__/            # Test files
├── dist/                 # Build output
└── ...
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10.18.3+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

### Building

```bash
# Build for production
pnpm build
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Linting

```bash
# Run ESLint
pnpm lint
```

### Type Checking

```bash
# Run TypeScript type check
pnpm type-check
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Vitest** - Testing framework
- **Tailwind CSS** - Styling
- **Radix UI** - UI components

## CI/CD

The project uses GitLab CI/CD for automated testing and deployment:

- **Staging**: Automatically deploys from `staging` branch
- **Production**: Manual deployment from `production` branch

## Deployment

The project is deployed to Vercel. See `vercel.json` for configuration.

## License

Private
