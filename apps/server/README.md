# RPS Rivals match server

Online matches run here: a Cloudflare Worker with one [Durable Object](https://developers.cloudflare.com/durable-objects/) per room code. Each room seats two players and runs the same `Referee` from `@rps/core` as the local game, so only the server knows both picks before the reveal. The game itself stays on GitHub Pages and connects to `wss://<worker address>/room/<CODE>`.

| File | What it does |
|---|---|
| `src/index.ts` | The Worker (routes `/room/CODE` to that room's Durable Object) and `RoomObject` (holds the two WebSockets) |
| `src/MatchRoom.ts` | The room itself: seats, ready, picks, rematch, leaving, idle timeouts. No Cloudflare code, so tests drive it with a fake clock |
| `test/MatchRoom.test.ts` | Room tests (run with the rest by `npm test` at the repo root) |
| `wrangler.jsonc` | Cloudflare settings: the Worker's name (`rps-rivals-server`) and the Durable Object class |
| `../../packages/core/src/online/protocol.ts` | The messages between game and room, shared by both |

## Run it locally

```sh
npm run dev:server   # the room server on http://localhost:8787 (first run downloads Wrangler)
npm run dev          # the game; in dev it connects to localhost:8787
```

Open the game in two browser windows: CREATE ROOM in one, JOIN ROOM with the code in the other.

## Deploy

`.github/workflows/deploy-server.yml` deploys on every push to `main` that touches `apps/server/` or `packages/core/`, and can be run by hand (Actions → Deploy server → Run workflow). It needs two repository secrets, **never** committed:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID

Without them the workflow skips the deploy with a warning. The Worker then lives at `https://rps-rivals-server.<workers.dev subdomain>.workers.dev`; that address (as `wss://...`) goes into `apps/game/src/config/online.ts` so release builds show ONLINE.

## Free plan limits

Workers Free includes SQLite-backed Durable Objects: 100,000 requests and 13,000 GB-s of run time a day, roughly 800 two-minute matches. A room closes itself if nobody joins within 10 minutes, or if nobody asks for a rematch within 2 minutes of a match ending, so abandoned rooms stop using time. Over the limit, new connections fail until midnight UTC; there is no bill on the free plan.
