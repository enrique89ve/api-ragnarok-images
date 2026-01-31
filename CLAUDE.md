# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Read-only** API for querying cards from **Ragnarok NFT** game. Serves metadata and image URLs stored in Cloudflare R2/CDN. Images are served directly from the CDN, **not** from this API.

## Stack

- Runtime: **Bun**
- Language: **TypeScript**
- Database: **PostgreSQL** (via `postgres` driver, async)
- CDN: **Cloudflare R2** (configurable via env)
- Docs: **Scalar** (OpenAPI 3.1)

## Commands

```bash
bun install  # Install dependencies
bun dev      # Development with hot reload
bun start    # Production
```

## Project Structure

```
ragnarok-api-images/
├── index.ts           # Entry point and Bun server
├── types.ts           # Types (CardJoinRow, PublicCard, SimpleCard, TableCard)
├── openapi.ts         # OpenAPI 3.1 spec
├── schema.sql         # PostgreSQL schema
├── services/
│   ├── database.ts    # Async PostgreSQL queries
│   └── cards.ts       # Async business logic
└── .env.example       # Environment variables
```

## Path Aliases

Use `@/` imports instead of relative paths:
```typescript
import { cardsService } from "@/services/cards";
import type { CardJoinRow } from "@/types";
```

## API Endpoints (Read-Only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Interactive UI (Scalar) |
| GET | `/openapi.json` | OpenAPI spec |
| GET | `/cards` | Simple list (id, name, image) |
| GET | `/cards?faction={f}` | Filter by faction |
| GET | `/cards?element={e}` | Filter by element |
| GET | `/cards?q={name}` | Search by name |
| GET | `/cards/stats` | Full list with stats |
| GET | `/cards/all?page=1&limit=20` | Paginated for tables |
| GET | `/cards/:id` | Single card detail |

> Filters (faction, element, q) are mutually exclusive.

## Async Architecture

All database and service functions are `async`:

```typescript
// database.ts
export async function getAllCards(): Promise<CardJoinRow[]>

// cards.ts
export async function listCards(...): Promise<SimpleCard[]>

// index.ts - handlers with await
const cards = await cardsService.listCards(faction, element, query);
```

## Security

- **Read-only**: No write endpoints (POST/PUT/DELETE)
- **CORS**: Only allows GET and OPTIONS
- **SQL**: Parameterized queries ($1, $2, ...) prevent injection

## Response Types

- **SimpleCard**: `{ id, name, image }` - For quick listings
- **PublicCard**: Full with stats, description, lore - For detail view
- **TableCard**: Flat with main fields - For tables
- **PaginatedResult**: `{ data, pagination: { page, limit, total, totalPages } }`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 4005) |
| `CDN_BASE` | Base URL for card images CDN |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | CORS allowed origin (default: *) |

## Database

Schema in `schema.sql`. Tables:
- `characters` - Characters (197)
- `cards` - Cards/arts (406)
- `stats` - Battle stats (197)
