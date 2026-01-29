# Ragnarok Cards API

Read-only API for querying cards from **Ragnarok NFT** game.

## Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Database:** SQLite
- **Docs:** OpenAPI 3.1 + Scalar

## Installation

```bash
bun install
```

## Usage

```bash
# Development (hot reload)
bun dev

# Production
bun start
```

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/docs` | Interactive documentation |
| GET | `/cards` | Simple list (id, name, image) |
| GET | `/cards/stats` | Full list with battle stats |
| GET | `/cards/all?page=1&limit=20` | Paginated for tables |
| GET | `/cards/:id` | Card detail |

## Configuration

Create `.env` based on `.env.example`:

```env
PORT=3000
CDN_BASE=https://cdn.d.v1.ragnaroknft.quest
DB_PATH=cards.sqlite
```

## Deployment

Configured for Nixpacks (Dekploy, Railway, etc):

```bash
nixpacks build .
```

## License

MIT
