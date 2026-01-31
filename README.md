# Ragnarok Cards API

Read-only API for querying cards from **Ragnarok NFT** game. 406 cards, 197 characters.

## Requirements

- [Bun](https://bun.sh/) v1.0+
- PostgreSQL 14+

## Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Docs:** OpenAPI 3.1 + Scalar

## Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

## Database Setup

1. Create a PostgreSQL database
2. Run the schema:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```
3. Seed with sample data:
   ```bash
   bun scripts/seed.ts
   ```

### Scripts

| Script | Description |
|--------|-------------|
| `scripts/seed.ts` | Populate database from `seed-data.json` |
| `scripts/validate.ts` | Verify database integrity |
| `scripts/setup-db.ts` | Run schema.sql and data.sql |

```bash
# Seed from default file (seed-data.json)
bun scripts/seed.ts

# Seed from custom file
bun scripts/seed.ts --file my-data.json

# Validate database
bun scripts/validate.ts
```

### Sample Data

`seed-data.json` contains 5 sample characters (Odin, Thor, Loki, Freya, Fenrir) with 20 cards and stats. Use it for testing or as a template for your own data.

## Configuration

Edit `.env` with your values:

```env
PORT=4005
CDN_BASE=https://cdn.d.v1.ragnaroknft.quest
DATABASE_URL=postgresql://user:password@localhost:5432/ragnarok
CORS_ORIGIN=*
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4005 |
| `CDN_BASE` | Base URL for card images | (required) |
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `CORS_ORIGIN` | CORS allowed origin | * |

## Usage

```bash
# Development (hot reload)
bun dev

# Production
bun start
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Interactive documentation (Scalar) |
| GET | `/openapi.json` | OpenAPI 3.1 spec |
| GET | `/cards` | Simple list (id, name, image) |
| GET | `/cards/stats` | Full list with stats and lore |
| GET | `/cards/all` | Paginated list for tables |
| GET | `/cards/:id` | Single card detail |

### Query Parameters

For `/cards` and `/cards/stats`:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `faction` | Filter by faction | `?faction=aesir` |
| `element` | Filter by element | `?element=fire` |
| `q` | Search by name | `?q=odin` |

> Note: Filters are mutually exclusive (only one applies at a time)

For `/cards/all`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `limit` | Items per page (max 100) | 20 |

### Examples

```bash
# Get all cards (simple)
curl http://localhost:4005/cards

# Search by name
curl http://localhost:4005/cards?q=thor

# Filter by faction
curl http://localhost:4005/cards/stats?faction=aesir

# Paginated list
curl http://localhost:4005/cards/all?page=2&limit=10

# Single card
curl http://localhost:4005/cards/1b21-8hx6f644
```

## Project Structure

```
├── index.ts           # Server entry point
├── types.ts           # TypeScript types
├── openapi.ts         # OpenAPI 3.1 specification
├── schema.sql         # PostgreSQL schema
├── services/
│   ├── database.ts    # Database queries (async)
│   └── cards.ts       # Business logic
├── scripts/
│   ├── seed.ts        # Seed database from JSON
│   ├── validate.ts    # Validate database integrity
│   └── setup-db.ts    # Run schema and data SQL
└── .env.example       # Environment template
```

## Deployment

Configured for Nixpacks (Dokploy, Railway, etc):

```bash
nixpacks build .
```

Set `DATABASE_URL` in your platform's environment variables.

## License

MIT
