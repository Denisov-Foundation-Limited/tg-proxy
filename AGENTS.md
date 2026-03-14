# AGENTS.md

## Project Summary

`tg-proxy` is a small Telegram Bot API HTTP proxy written in Node.js.

Current stack:

- Node.js `20+`
- Express
- Awilix
- ES Modules
- Docker
- Docker Compose

Primary goal:

- accept HTTP requests on a local/public endpoint
- forward them to `api.telegram.org`
- stream the upstream response back to the client

Default runtime settings:

- port: `5000`
- upstream base URL: `https://api.telegram.org`

## Current Architecture

Entry point:

- `server.js`

Core files:

- `src/container.js`
- `src/app-config.js`
- `src/logger.js`
- `src/proxy-server.js`
- `src/telegram-proxy-service.js`

Dependency injection:

- implemented with `Awilix`
- `server.js` creates the container and resolves `proxyServer`
- the container currently registers:
  - `env`
  - `fetchImpl`
  - `app`
  - `config`
  - `logger`
  - `telegramProxyService`
  - `proxyServer`

## Important Implementation Decisions

### 1. Port

The project originally used port `3000`, then was changed to `5000`.

This change is reflected in:

- runtime config
- Dockerfile
- docker-compose
- README

### 2. POST request fix

There was a bug where `POST` requests returned `Empty reply from server`.

Cause:

- the proxy used `req.on("close")`
- on normal request completion this could abort the upstream `fetch` too early

Fix:

- use `req.on("aborted")` for actual client aborts
- keep `res.on("close")` to stop the upstream request only if response output closes before completion

This behavior is important and should not be reverted accidentally.

### 3. Streaming proxy design

The proxy intentionally uses stream forwarding instead of parsing request bodies.

Reason:

- support Telegram JSON requests
- support form data
- support file uploads
- avoid unnecessary body buffering

Implementation detail:

- request body is passed through `Readable.toWeb(req)`
- upstream response body is returned through `Readable.fromWeb(...).pipe(res)`

### 4. Headers

The proxy currently removes selected hop-by-hop headers before forwarding:

- `host`
- `connection`
- `content-length`

If header handling is changed, check Telegram compatibility carefully.

### 5. Module system

The project started as CommonJS and was later migrated to ES Modules.

Current rules:

- use `import` / `export`
- local imports must include `.js` extension
- `package.json` contains `"type": "module"`

Do not reintroduce `require()` unless the whole module system is intentionally changed again.

### 6. Formatting conventions

Current conventions:

- JavaScript code uses `4` spaces indentation
- source files include a C-style header comment in `.js` files
- non-JS files do not use that header
- comments use detailed Doxygen/JSDoc-style blocks

### 7. Logging

There is a dedicated logger class in `src/logger.js`.

Log format:

```text
[YYYY-MM-DD][HH:MM:SS][LEVEL][SCOPE] message
```

Examples of scopes currently used:

- `SERVER`
- `PROXY`

The user explicitly requested a format similar to:

```text
[2026-03-14][21:02:58][INFO][STACK] Sync master unit: Дом item: avr enabled: false
```

If logging is expanded, keep this format stable unless asked otherwise.

## Containerization Notes

Files:

- `Dockerfile`
- `docker-compose.yml`

Expected workflow after code changes:

```bash
docker compose up -d --build
```

Important operational note:

- `docker compose up -d` without `--build` will often keep running the old image
- this already caused confusion during debugging, so prefer documenting and using `--build`

## Documentation State

README now includes:

- quick start
- Docker usage
- architecture overview
- ASCII diagrams
- logging format
- request examples
- behavior notes

## Things The User Explicitly Asked For

The following user requests have already been implemented:

- create a simple Telegram HTTP proxy on Node.js + Express
- provide Dockerfile
- provide docker-compose
- move port to `5000`
- commit and push changes
- fix broken POST request handling
- refactor into classes
- add dependency injection
- specifically use `Awilix`
- add a logger class
- make the logger format structured
- propagate file headers to `.js` files only
- migrate the project from CommonJS to ES Modules
- add detailed Doxygen/JSDoc comments
- use `4` spaces indentation in `.js` code
- expand README
- create this `AGENTS.md`

## Known Constraints

- `package.json` cannot contain comment headers because JSON does not support comments
- local Node installation in the original development environment was once broken because of missing `icu4c`; Docker worked correctly and remains the safer validation path
- project scope is intentionally small and minimalistic

## Recommended Next Improvements

If the user asks for further hardening, likely next steps are:

- request/response debug logging toggle via env
- rate limiting
- IP allowlist
- authentication in front of proxy
- reverse proxy integration
- tests for header forwarding and POST behavior
- graceful shutdown handling

## Agent Guidance

When editing this project:

- preserve ES Modules
- preserve 4-space indentation in `.js`
- preserve the existing header comment style in `.js`
- preserve the logger format
- be careful with request streaming behavior
- be careful not to regress the POST abort fix
- if changing Docker behavior, keep runtime port aligned across config, docs and container files
