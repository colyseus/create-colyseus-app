# Colyseus Monorepo

This is a monorepo template for a Colyseus project with a shared state schema.

## Structure

- `apps/backend` - Colyseus server
- `apps/frontend` - Vite client application  
- `packages/shared` - Shared state schema (used by both backend and frontend)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run both backend and frontend in development mode:

```bash
pnpm dev
```

## Building

Build all packages:

```bash
pnpm build
```
