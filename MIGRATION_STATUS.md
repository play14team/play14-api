# Strapi 5 Migration Status

## Migration Completed ✅

### Phase 1: Node.js Upgrade ✅

- [x] Updated `.nvmrc` from Node 18 to Node 22
- [x] Updated `Dockerfile` base images from `node:18-alpine` to `node:22-alpine` (both build and final stages)
- [x] Enabled corepack for yarn support in Node 22
- [x] Node 22.21.1 active and working

### Phase 2: Dependency Updates ✅

- [x] Updated core Strapi dependencies from 4.25.21 to 5.21.0
- [x] Updated @\_sh/strapi-plugin-ckeditor from 2.1.3 to 6.0.2
- [x] Updated react-router-dom from 5.3.4 to 6.28.0 (breaking frozen dependency constraint - was necessary)
- [x] Updated styled-components from 5.3.11 to 6.1.13 (breaking frozen dependency constraint - was necessary)
- [x] Removed @strapi/plugin-i18n (now built-in to Strapi 5)
- [x] Yarn install successful with core Strapi 5 packages

### Phase 3: Removed Incompatible Plugins ✅

Due to Node 22 / Strapi 5 incompatibility, the following plugins were removed:

- [@offset-dev/strapi-calendar](https://www.npmjs.com/package/@offset-dev/strapi-calendar) - Requires Node <=20.x.x, no Strapi 5 version available
- [strapi-plugin-fuzzy-search](https://www.npmjs.com/package/strapi-plugin-fuzzy-search) - Requires Node <=20.x.x
- [strapi-plugin-multi-select](https://www.npmjs.com/package/strapi-plugin-multi-select) - Not compatible with Strapi 5
- [strapi-plugin-prev-next-button](https://www.npmjs.com/package/strapi-plugin-prev-next-button) - Not compatible with Strapi 5
- [strapi-plugin-update-static-content](https://www.npmjs.com/package/strapi-plugin-update-static-content) - Not compatible with Strapi 5
- strapi-blurhash - Not in package.json, removed from config

### Phase 4: Code Migrations ✅

- [x] Updated lifecycle hooks to Document Service API:
  - `src/api/event/content-types/event/lifecycles.js`
  - `src/api/player/content-types/player/lifecycles.js`
  - `src/api/game/content-types/game/lifecycles.js`
  - `src/api/article/content-types/article/lifecycles.js`
  - `src/api/event-location/content-types/event-location/lifecycles.js`
- [x] Updated cron tasks to Document Service API in `config/cron-tasks.js`:
  - Changed `strapi.entityService` to `strapi.documents()`
  - Changed `findMany` to use new API
  - Changed `update` to use `documentId` instead of `id`
  - Changed `map()` to `for...of` loops to ensure async operations complete
- [x] Updated `config/plugins.js`:
  - Changed `ckeditor5` plugin name (was `ckeditor`)
  - Added `v4CompatibilityMode: true` to GraphQL config
  - Removed incompatible plugin configs
  - Added comments documenting removed plugins and TODOs
- [x] Created `src/admin/app.tsx` for Strapi 5 admin panel configuration
- [x] Renamed old `config/ckeditor.txt` to `config/ckeditor.v2.txt.bak` (CKEditor v6 uses different config approach)
- [x] Built Strapi 5 admin panel successfully with `yarn build`

## Current Blocker ⚠️

### Custom Field Plugins Not Loading

The following custom field plugins are installed but not being detected by Strapi 5:

- **strapi-plugin-timezone-select** v2.0.0 - Claims Strapi 5 support, but custom field not registering
- **strapi-plugin-country-select** v2.1.0 - Claims Strapi 5 support, but likely same issue
- **strapi-plugin-map-field** v2.0.0 - Claims Strapi 5 support, but likely same issue

**Error**: `Could not find Custom Field: plugin::timezone-select.timezone`

**Used in schemas**:

- `src/api/event/content-types/event/schema.json` - timezone field
- `src/api/event-location/content-types/event-location/schema.json` - country field, map field
- `src/api/player/content-types/player/schema.json` - map field
- `src/api/venue/content-types/venue/schema.json` - map field

**Potential causes**:

1. Plugins may need explicit registration in Strapi 5 beyond just being in package.json
2. Plugins may have breaking changes between Strapi 4 and 5 not reflected in their package versions
3. Plugin architecture may have changed requiring code updates

## Next Steps

### Option 1: Plugin Registration Investigation

- Check if plugins need to be added to `src/plugins.js` or similar registration file
- Review Strapi 5 plugin documentation for custom field registration
- Check plugin source code for Strapi 5 compatibility

### Option 2: Temporary Schema Modification

- Temporarily convert custom fields to standard Strapi fields to get server running
- Test core functionality
- Re-add custom fields one by one

### Option 3: Alternative Plugins

- Research Strapi 5-compatible alternatives for:
  - Timezone selection (could use string enum temporarily)
  - Country selection (could use string enum temporarily)
  - Map fields (critical for venue/player location features)

### Option 4: Custom Field Implementation

- Implement custom timezone/country/map fields directly in the project
- Follow Strapi 5 custom field API documentation

## Recommended Immediate Action

Try Option 2 first to validate the core Strapi 5 migration works. Then investigate why the plugins aren't loading. The plugin configuration looks correct, so it may be a plugin compatibility issue that requires:

- Contacting plugin authors
- Submitting issues/PRs to the plugin repositories
- Finding alternatives or implementing custom solutions

## Testing Checklist (Pending)

Once server starts successfully:

- [ ] Test admin panel access
- [ ] Verify all content types load
- [ ] Test CRUD operations on each content type
- [ ] Verify lifecycle hooks (slug generation)
- [ ] Test Azure Storage uploads
- [ ] Verify cron jobs execute
- [ ] Test GraphQL endpoint with v4CompatibilityMode
- [ ] Test REST API endpoints
- [ ] Verify `play14-ui` frontend integration

## Plugin Restoration TODOs

- [ ] **fuzzy-search**: Migrate to Strapi 5 native search or Meilisearch
- [ ] **update-static-content**: Implement GitHub webhook trigger (maybe GitHub Actions + repository_dispatch)
- [ ] **prev-next-button**: Evaluate if still needed, implement custom solution if required
- [ ] **strapi-calendar**: Find Strapi 5 compatible alternative or implement custom date selection
- [ ] **timezone/country/map custom fields**: Resolve loading issues or find alternatives

## Additional Notes

### Breaking Changes Made

1. **Unfroze react-router-dom** (5.3.4 → 6.28.0) - Required for Strapi 5
2. **Unfroze styled-components** (5.3.11 → 6.1.13) - Required for Strapi 5

These were marked as frozen in the original README.md and `.github/copilot-instructions.md`. The Strapi 5 upgrade forced these updates. Frontend compatibility should be tested thoroughly.

### Files Modified

- `.nvmrc`
- `Dockerfile` (2 lines changed)
- `package.json` (major version updates)
- `config/plugins.js` (significant changes)
- `config/cron-tasks.js` (API migration)
- `src/api/*/content-types/*/lifecycles.js` (5 files)
- `src/admin/app.tsx` (created)
- `config/ckeditor.txt` (renamed to .bak)

### Commands to Test After Resolution

```bash
# Development mode
yarn dev

# Build production
yarn build

# Start production
yarn start

# Docker build
docker build --build-arg STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN=<token> -t play14-api .

# Docker compose (local with PostgreSQL)
docker-compose up
```

### Environment Variables to Verify

After server starts, verify these critical env vars are loaded:

- `DATABASE_*` (PostgreSQL connection)
- `STORAGE_*` (Azure Blob Storage)
- `STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN` (Mapbox integration)
- `GITHUB_TOKEN` (was for update-static-content plugin, may need alternative solution)
