# CLAUDE.md

## Project overview

This is a maintained fork of [jeeves5454/Homebox-mcp](https://github.com/jeeves5454/Homebox-mcp). It implements an MCP server that bridges AI assistants and the [Homebox](https://homebox.software/) home inventory REST API. See [README.md](README.md) for full documentation.

## Validating changes

Before considering any change complete, run:

```bash
source ~/.nvm/nvm.sh && nvm use && npm run validate
```

`npm run validate` runs `lint:fix` (ESLint, write mode) → `format` (Prettier, write mode) → `build` (TypeScript compilation) in sequence. It fixes what it can and fails on what it cannot. This is the only command needed for local validation — do not run the steps individually unless debugging a specific tool.

## Architecture

The entire server lives in `src/index.ts` (~2000 lines). There is no module split — all logic is in one file by design.

**Key classes and functions:**

- `HomeboxClient` — wraps axios with auth, per-request collection switching (`X-Tenant` header), and a 401-retry interceptor. All Homebox API calls go through this class. It detects the Homebox version at startup (v0.23.0 renamed `/api/v1/labels` → `/api/v1/tags`) and sets `tagEndpoint`/`tagFilterParam` accordingly.
- `setupHandlers()` — registers all MCP tool and resource handlers on the `Server` instance. Tool dispatch is a single `switch` on `request.params.name`.
- `main()` — loads `config.json`, creates `HomeboxClient` and `Server`, then starts either stdio transport (default) or HTTP transport (when `PORT` env var is set). In stdio mode auth is verified eagerly; in HTTP mode it is deferred to the first request.

**Two transport modes:**

- **stdio** — for Claude Desktop / local use. One process per session.
- **HTTP (Streamable HTTP, MCP spec 2025-03-26)** — for claude.ai remote MCP. Sessions are keyed by session ID; one `StreamableHTTPServerTransport` per session stored in a `Map`. Set `PORT` env var to activate.

**Collection (multi-tenant) support:** Homebox calls them "groups" in the API. Every inventory tool accepts an optional `collection` parameter (name or ID). `HomeboxClient.resolveCollection()` resolves the name to a group ID, which is then passed as the `X-Tenant` header on each request. There is no global "active collection" state — scoping is per-request.

**Attachments:** `get_item_attachment` returns both a proxy URL (HTTP mode only, requires `ATTACHMENT_BASE_URL`) and a `resource_link` for `resources/read`. The proxy is implemented as a `/attachments/:token` route on the HTTP server.

## Configuration

Runtime config is read from `config.json` at startup (see `config.json.example`). The file is gitignored. Required fields: `homeboxUrl`, `email`, `password`.

## E2E tests

`npm run test:e2e` requires Docker. It spins up a local Homebox instance via `docker-compose.test.yml` and exercises the MCP server against it. To test against an older Homebox version:

```bash
HOMEBOX_VERSION=0.22.3 npm run test:e2e
```
