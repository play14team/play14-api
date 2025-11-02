# #play14 API - Copilot Instructions

## Architecture Overview

This is a **Strapi v4** headless CMS API serving the #play14 community platform. Core architecture:

- **Backend**: Strapi 4.25.21 with PostgreSQL database
- **Deployment**: Azure Container Apps via Docker (multi-stage builds)
- **Storage**: Azure Blob Storage for media uploads
- **Frontend Integration**: Triggers `play14-ui` repo rebuilds via GitHub Actions (see `update-static-content` plugin config)

### Key Content Types

Located in `src/api/*/content-types/*/schema.json`:

- **Events**: Community gatherings with status workflow (Announced → Open → Over → Cancelled)
- **Players**: Community members with hierarchical positions (Player → Host → Mentor → Founder)
- **Games**: Serious games catalog with fuzzy search
- **Venues**: Physical event locations with map coordinates (Mapbox integration)

## Development Workflow

### Local Development

```bash
yarn dev              # Start with auto-reload (port 1337)
yarn build            # Build admin panel
yarn start            # Production mode without reload
```

### Docker Workflow

```bash
# Local testing with docker-compose (includes PostgreSQL)
docker-compose up

# Production build (requires STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN)
docker build --build-arg STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN=<token> -t play14-api .
```

### Environment Setup

Copy `.env.example` → `.env`. Critical variables:

- **Database**: PostgreSQL with SSL enabled for Azure (see `config/database.js`)
- **Azure Storage**: `STORAGE_ACCOUNT`, `STORAGE_ACCOUNT_KEY`, `STORAGE_CDN_URL`
- **Security**: `APP_KEYS` (4 comma-separated keys), `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`

## Strapi-Specific Patterns

### Slug Generation with Lifecycle Hooks

All content types auto-generate slugs via `lifecycles.js` using `src/libs/strings.js`:

```javascript
// Example: src/api/event/content-types/event/lifecycles.js
const { eventToSlug } = require("../../../../libs/strings");
module.exports = {
  beforeCreate(event) {
    event.params.data.slug = eventToSlug(
      event.params.data.name,
      event.params.data.start
    );
  },
};
```

**Pattern**: Events use `name-MM` format (name + month), others use standard slugify.

### Custom Routes

Standard Strapi routes in `src/api/*/routes/*.js`, plus custom routes like:

- `src/api/event/routes/custom-event.js`: GET `/events/:slug` for slug-based lookups

### Plugin Configuration (`config/plugins.js`)

- **Azure Storage Upload**: Custom provider with CDN support
- **Fuzzy Search**: Configured for events (threshold: -200) and players with weighted fields
- **Update Static Content**: Triggers GitHub workflow 52506304 in `play14-ui` repo
- **GraphQL**: Enabled with introspection for development

### Cron Jobs (`config/cron-tasks.js`)

Automated at midnight UTC:

1. **Event Status** (00:00): Transitions "Open"/"Announced" events past their end date to "Over"
2. **Player Position** (00:05): Upgrades Player → Host (if hosted events) → Mentor (if mentored)

**Note**: Cron disabled in production via `config/env/production/server.js` (`CRON_ENABLED=false`)

## Critical Constraints

### Frozen Dependencies (README.md)

**DO NOT UPDATE** these packages without explicit approval:

- `react-router-dom` (pinned to 5.3.4 - v6 breaking changes)
- `styled-components` (pinned to 5.3.11 - theme compatibility)

### Security & CORS

CSP configured in `config/middlewares.js`:

- Allows Mapbox CDN (`api.mapbox.com`, `cdn.jsdelivr.net`)
- Azure Storage domains from `STORAGE_URL`/`STORAGE_CDN_URL` env vars
- `upgradeInsecureRequests: null` for Azure App Service compatibility

### File Watching

Admin panel ignores changes in `config/sync/**`, `bootstrap/md/**`, `bootstrap/json/**` (see `config/admin.js`)

## Deployment Pipeline

GitHub Actions workflow (`.github/workflows/play14-api-aca.yml`):

1. Triggers on `main` branch push
2. Builds Docker image with Mapbox token build arg
3. Pushes to Azure Container Registry (`play14containerregistry.azurecr.io`)
4. Deploys to Azure Container App `play14-api` in `play14-community` resource group

**IaC**: PowerShell scripts in `iac/` for Azure infrastructure provisioning.

## Component Structure

Reusable components in `src/components/`:

- `contact/`, `events/`, `games/`, `location/`, `registration/`, `reporting/`, `shared/`
- Used in content type schemas for complex field groups

## Common Pitfalls

1. **Slug Conflicts**: Lifecycle hooks modify data before save - don't manually set slugs
2. **GraphQL Cache**: Restart dev server after schema changes to refresh introspection
3. **Azure Upload**: Requires `defaultPath: "assets"` in provider config - don't change without CDN updates
4. **Yarn Version**: Using Yarn 1.22.22 (see `packageManager` in package.json) - avoid `npm`
5. **Node Version**: Check `.nvmrc` for required Node.js version (18.x expected from Dockerfile)
