# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**#play14 API** is a Strapi 5 headless CMS serving the #play14 global community platform for agile game players and facilitators. Currently on `migration-v5` branch after upgrading from Strapi 4 with Node 22.

**Tech Stack**: Strapi 5.33.0, Node.js 22, PostgreSQL 14.5, Azure Container Apps, Azure Blob Storage, GraphQL + REST APIs

## Common Development Commands

### Local Development
```bash
yarn develop          # Start Strapi in development mode with auto-reload
yarn dev              # Start with Podman Compose and follow logs
yarn build            # Build admin panel (required after plugin/config changes)
yarn start            # Production mode without reload
yarn down             # Stop and remove Podman Compose containers
```

### Database Operations
```bash
yarn export           # Export database to ../backup/database/play14
yarn import           # Import from ../backup/database/play14.tar.gz.enc
```

### Container Development
```bash
# Local with PostgreSQL + Adminer (using Podman Compose)
yarn dev              # Starts containers and follows logs
yarn down             # Stops and removes containers

# Or use Podman Compose directly
podman compose up -d
podman logs -f play14-api
podman compose down

# Production build (requires Mapbox token)
podman build --build-arg STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN=<token> -t play14-api .

# Run container with env file
podman run -p 1337:1337 -it --env-file=./.env --name play14-api play14-api
```

**Note**: This project uses Podman instead of Docker. All commands use `podman` and `podman compose` instead of `docker` and `docker-compose`.

### Infrastructure Deployment (Bicep)
```powershell
# Validate Bicep templates
bicep build iac/main.bicep

# Deploy to dev environment
az deployment group create --resource-group play14-dev --template-file iac/main.bicep --parameters @iac/dev.parameters.json

# Validate without executing
az deployment group validate --resource-group play14-dev --template-file iac/main.bicep --parameters @iac/dev.parameters.json
```

## Architecture & Code Structure

### Content Type Pattern
All API resources in `src/api/*/` follow this Strapi structure:
```
src/api/{resource}/
├── content-types/{resource}/
│   ├── schema.json         # Data model with customType fields
│   └── lifecycles.js       # Hooks for slug generation, etc.
├── controllers/            # Request handlers
├── services/               # Business logic layer
└── routes/                 # Route definitions (auto-generated + custom)
```

### Key Content Types & Relationships

**Event** (primary resource):
- Has one `event-location` (venue details)
- Has many `players` (attendees, linked via `attended` relation)
- Has many `players` (hosts, linked via `hosted` relation)
- Has many `players` (mentors, linked via `mentored` relation)
- Has many `sponsors`
- Status workflow: `Announced` → `Open` → `Over` (or `Cancelled`)

**Player** (community members):
- Position hierarchy: `Player` → `Host` → `Mentor` → `Founder`
- Positions auto-promoted by cron based on event history
- Has many `events` through `attended`, `hosted`, `mentored` relations

**Custom Fields** (migration blocker - see below):
- Timezone: `plugin::timezone-select.timezone` (used in events)
- Country: `plugin::country-select.country` (used in locations)
- Map: `plugin::map-field.map` (used in venues, players)

### Slug Generation Pattern

All content types auto-generate slugs in `lifecycles.js` using `src/libs/strings.js`:

```javascript
const { eventToSlug } = require("../../../../libs/strings");

module.exports = {
  beforeCreate(event) {
    // Events use "name-MM" format (name + start month)
    event.params.data.slug = eventToSlug(
      event.params.data.name,
      event.params.data.start
    );
  },
  beforeUpdate(event) {
    if (event.params.data.name || event.params.data.start) {
      event.params.data.slug = eventToSlug(
        event.params.data.name,
        event.params.data.start
      );
    }
  }
};
```

**Important**: Never manually set slugs - lifecycle hooks handle this automatically.

### Automated Tasks (Cron Jobs)

Located in `config/cron-tasks.js`, using Document Service API:

**Event Status Automation** (daily at 00:00 UTC):
- Transitions events past their end date from `Open`/`Announced` to `Over`
- Uses `strapi.documents('api::event.event').findMany()` and `.update()`

**Player Position Management** (daily at 00:05 UTC):
- Auto-promotes: Player → Host (if hosted ≥1 event) → Mentor (if mentored ≥1 event)
- Founders are immutable
- Uses populated relations to check event counts

**Note**: Cron is disabled in production by default (`CRON_ENABLED=false` in `config/env/production/server.js`). Enable with environment variable.

### GitHub Actions Integration

Custom service in `src/api/github-trigger/services/github-trigger.js` triggers frontend (`play14-ui`) rebuilds on content changes:

- Listens for publish/unpublish/delete events on: Events, Players, Games, Articles, Home, Venues, Hostings
- Debounces triggers (5-second window)
- Calls GitHub Actions API via `GITHUB_TOKEN`
- Workflow: `play14team/play14-ui` workflow ID `52506304`
- Hooks registered in `src/extensions/github-trigger-lifecycles.js` (uses DB lifecycle API, not Document Service)

### Plugin Configuration

Key plugins in `config/plugins.js`:

**GraphQL**:
- Enabled with introspection for development
- `v4CompatibilityMode: true` for migration compatibility

**Upload (Azure Storage)**:
- Provider: `strapi-provider-upload-azure-storage`
- Container: `strapi_uploads`
- CDN: `STORAGE_CDN_URL` environment variable
- `defaultPath: "assets"` - don't change without CDN updates

**Fuzzy Search**:
- Configured for events (threshold: -200) and players
- Weighted fields for relevance

**CKEditor 5**:
- Custom rich text editor (@_sh/strapi-plugin-ckeditor 6.0.2)
- Note: CKEditor v6 uses different config approach than v2

### Custom Routes

Standard Strapi routes are auto-generated. Custom routes include:

**Event by Slug**: `src/api/event/routes/custom-event.js`
```javascript
{
  method: 'GET',
  path: '/events/:slug',
  handler: 'event.findOneBySlug',
}
```

## Migration Status & Known Issues

### Strapi 5 Migration (Current Branch: migration-v5)

**Completed**:
- ✅ Node.js 18 → 22
- ✅ Strapi 4.25.21 → 5.33.0
- ✅ Lifecycle hooks migrated to Document Service API
- ✅ Cron tasks updated to new API
- ✅ Admin panel configuration (`src/admin/app.tsx`)
- ✅ Breaking dependency updates (react-router-dom 5→6, styled-components 5→6)
- ✅ Container runtime migrated from Docker to Podman

**Current Blocker** ⚠️:
Custom field plugins are installed but not registering:
- `strapi-plugin-timezone-select` v2.0.0
- `strapi-plugin-country-select` v2.1.0
- `strapi-plugin-map-field` v2.0.0

Error: `Could not find Custom Field: plugin::timezone-select.timezone`

Affects schemas in: `event`, `event-location`, `player`, `venue` content types.

**Possible solutions**:
1. Check if Strapi 5 requires explicit plugin registration beyond package.json
2. Temporarily convert to standard Strapi fields for testing
3. Contact plugin authors or fork plugins
4. Implement custom fields directly in project

See [MIGRATION_STATUS.md](MIGRATION_STATUS.md) for detailed migration tracking.

### Removed Plugins (Node 22/Strapi 5 Incompatible)

- `@offset-dev/strapi-calendar` - No Strapi 5 version
- `strapi-plugin-fuzzy-search` - Reinstalled beta version for Strapi 5
- `strapi-plugin-multi-select` - Reinstalled v2.1.1
- `strapi-plugin-prev-next-button` - Removed
- `strapi-plugin-update-static-content` - Replaced with custom `github-trigger` service

## Critical Constraints

### Frozen Dependencies (Now Updated)

**Historical note**: These were previously frozen but had to be updated for Strapi 5:
- ~~`react-router-dom` (was 5.3.4)~~ → Now 6.28.0 (test admin panel compatibility)
- ~~`styled-components` (was 5.3.11)~~ → Now 6.1.13 (test admin panel compatibility)

### Database Configuration

PostgreSQL with SSL enabled (`config/database.js`):
```javascript
{
  client: 'postgres',
  connection: {
    host: env('DATABASE_HOST'),
    port: env.int('DATABASE_PORT'),
    database: env('DATABASE_NAME'),
    user: env('DATABASE_USERNAME'),
    password: env('DATABASE_PASSWORD'),
    ssl: env.bool('DATABASE_SSL', true) && {
      rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
    },
  },
}
```

**Important**: SSL required for Azure Database for PostgreSQL. Set `DATABASE_SSL_SELF=true` for local development with self-signed certificates.

### Security & CORS

CSP configured in `config/middlewares.js`:
- Allows Mapbox CDN (`api.mapbox.com`, `cdn.jsdelivr.net`)
- Azure Storage domains from `STORAGE_URL`/`STORAGE_CDN_URL`
- `upgradeInsecureRequests: null` for Azure App Service compatibility

### Package Manager

**Use Yarn 1.22.22 exclusively** (pinned in `package.json`):
```json
"packageManager": "yarn@1.22.22+sha512..."
```
Do not use npm commands.

### Node Version

Use Node 22 (`.nvmrc`):
```bash
nvm use 22
```

## Deployment Pipeline

GitHub Actions workflow (`.github/workflows/play14-api-aca.yml`):
1. Triggers on `main` branch push
2. Builds Docker image with Mapbox token build arg
3. Pushes to Azure Container Registry
4. Deploys to Azure Container App `play14-api` in `play14-community` resource group

**Infrastructure as Code**: Bicep templates in `iac/bicep/` with parameters for dev/acceptance/prod environments.

## Environment Variables

Critical variables (see `.env.example`):

**Database**:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `DATABASE_SSL=true` (required for Azure)
- `DATABASE_DEBUG=false` (set true for query debugging)

**Azure Storage**:
- `STORAGE_ACCOUNT`, `STORAGE_ACCOUNT_KEY`
- `STORAGE_URL` (blob storage base URL)
- `STORAGE_CDN_URL` (CDN endpoint)

**Security**:
- `APP_KEYS` (4 comma-separated keys for session encryption)
- `ADMIN_JWT_SECRET`, `JWT_SECRET`, `API_TOKEN_SALT`

**Integrations**:
- `GITHUB_TOKEN` (for triggering play14-ui rebuilds)
- `STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN` (required for admin panel maps)

**Cron**:
- `CRON_ENABLED=false` (set true in production to enable automated tasks)

## Common Pitfalls

1. **Slug Conflicts**: Don't manually set slugs - lifecycle hooks auto-generate them
2. **GraphQL Cache**: Restart dev server after schema changes to refresh introspection
3. **Custom Fields**: Current blocker - plugins installed but not registering with Strapi 5
4. **Azure Upload**: `defaultPath: "assets"` required - don't change without CDN updates
5. **Node Version**: Use Node 22 exactly (`.nvmrc`)
6. **Yarn Only**: Never use npm - package manager pinned to yarn@1.22.22
7. **Cron Jobs**: Disabled by default - enable with `CRON_ENABLED=true` in production
8. **File Watching**: Admin panel ignores `config/sync/**`, `bootstrap/md/**`, `bootstrap/json/**`

## Reference Documentation

**Coding Standards & Instructions**: See `.github/instructions/` for:
- `strapi5.instructions.md` - Strapi 5 best practices
- `nodejs.instructions.md` - Node.js/JavaScript guidelines
- `testing.instructions.md` - Testing standards
- `security.instructions.md` - Security best practices
- `bicep.instructions.md` - Infrastructure as Code
- And 11 more domain-specific guides

**Reusable Prompts**: See `.github/prompts/` for common tasks:
- `setup-strapi-component.prompt.md`
- `deploy-azure-infrastructure.prompt.md`
- `write-tests.prompt.md`
- And 13 more task-specific prompts

**Chat Modes**: See `.github/chatmodes/` for specialized AI roles:
- `strapi-architect.chatmode.md` - Architecture planning
- `azure-architect.chatmode.md` - Infrastructure design
- `debugger.chatmode.md` - Bug hunting
- And 4 more specialized modes

## Key File Locations

| Component | Path |
|-----------|------|
| Main bootstrap | `src/index.js` |
| API definitions | `src/api/` |
| Slug utilities | `src/libs/strings.js` |
| Config files | `config/` |
| Database config | `config/database.js` |
| Cron tasks | `config/cron-tasks.js` |
| Plugin config | `config/plugins.js` |
| Middleware config | `config/middlewares.js` |
| GitHub trigger service | `src/api/github-trigger/services/github-trigger.js` |
| Lifecycle extensions | `src/extensions/github-trigger-lifecycles.js` |
| Admin config | `src/admin/app.tsx` |
| Components | `src/components/` |
| Bootstrap data | `bootstrap/` |
| Infrastructure | `iac/bicep/` |
| Containers | `Dockerfile`, `docker-compose.yml` (Podman compatible) |
| Migration docs | `MIGRATION_STATUS.md`, `MIGRATION_PLAN_STRAPI5.md` |
