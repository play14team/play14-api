# Migration Plan: Strapi 4 to Strapi 5 + Node.js Upgrade

**Current State:**

- Strapi: 4.25.21
- Node.js: 18
- Database: PostgreSQL with Azure
- Deployment: Azure Container Apps via Docker

**Target State:**

- Strapi: 5.x (latest stable)
- Node.js: 22 LTS (preferred) or 24 (if needed)
- Maintain existing Azure infrastructure

---

## Phase 0: Pre-Migration Preparation

### 0.1 Backup Everything

- [ ] **Database Backup**

  - Create Azure PostgreSQL backup via Azure Portal
  - Export local copy: `yarn export` (stores in `../backup/database/play14`)
  - Document current database connection settings

- [ ] **Code Backup**

  - Create migration branch: `git checkout -b migration/strapi-5-node-22`
  - Tag current state: `git tag v4-pre-migration`
  - Archive current working directory

- [ ] **Environment Variables Backup**
  - Copy `.env` to `.env.v4.backup`
  - Document all Azure App Settings from `appSettings.json`

### 0.2 Plugin Compatibility Audit

#### ✅ Confirmed Compatible with Strapi 5:

1. **@\_sh/strapi-plugin-ckeditor** → v6.0.2 (Strapi 5.0.0+)
   - Config location changes from `config/plugins.js` to `src/admin/app.tsx`
   - Will need to adapt configuration approach
2. **strapi-plugin-country-select** → v2.1.0 (Strapi 5.7.0+)

   - Drop-in replacement, no config changes needed

3. **@strapi/plugin-graphql** → v5.21.0 (built-in to Strapi 5)

   - GraphQL config in `config/plugins.js` requires compatibility mode update

4. **strapi-plugin-config-sync** → v3.1.2 (Strapi 5 compatible)

   - Verify sync directory structure compatibility

5. **strapi-plugin-map-field** → v2.0.0 (Strapi 5 compatible)

   - No config changes expected

6. **strapi-plugin-timezone-select** → v2.0.0 (Strapi 5 compatible)

   - No config changes expected

7. **strapi-provider-upload-azure-storage** → v3.5.0 (Strapi 5 compatible)
   - Config structure unchanged

#### ⚠️ Plugins Requiring Research:

1. **@offset-dev/strapi-calendar** (v0.1.1)

   - Check marketplace for Strapi 5 compatibility
   - Alternative: Consider built-in date fields if calendar view not critical

2. **strapi-plugin-fuzzy-search** (v3.0.0)

   - Verify Document Service API compatibility
   - May need Entity Service → Document Service migration

3. **strapi-plugin-multi-select** (v1.2.3)

   - Check if still needed (Strapi 5 has improved relation handling)

4. **strapi-plugin-prev-next-button** (v1.2.0)

   - Admin panel plugin - verify UI compatibility

5. **strapi-plugin-update-static-content** (v2.0.7)
   - Custom plugin triggering GitHub Actions
   - May need lifecycle hook updates

#### ❌ Plugins No Longer Needed:

- **@strapi/plugin-i18n** → Now built into Strapi 5 core
- **strapi-blurhash** → Not in package.json, remove from config

---

## Phase 1: Node.js Upgrade (Separate First Step)

### 1.1 Update Node.js Environment

- [ ] Update `.nvmrc`: Change `18` to `22`
- [ ] Update `Dockerfile`:
  ```dockerfile
  FROM node:22-alpine as build
  # ... and final stage
  FROM node:22-alpine
  ```
- [ ] Update CI/CD expectations in `.github/workflows/play14-api-aca.yml`
- [ ] Test locally with Node 22:
  ```bash
  nvm install 22
  nvm use 22
  node -v  # Verify 22.x.x
  ```

### 1.2 Verify Current Strapi 4 on Node 22

- [ ] Clean install: `rm -rf node_modules && yarn install`
- [ ] Build: `yarn build`
- [ ] Start dev: `yarn dev`
- [ ] Test critical endpoints:
  - `/api/events`
  - `/api/players`
  - `/api/games`
  - Admin panel login
- [ ] **COMMIT CHECKPOINT**: "chore: upgrade Node.js 18→22"

---

## Phase 2: Update to Latest Strapi 4 Minor/Patch

### 2.1 Upgrade to v4.25.9 (Latest v4)

- [ ] Run upgrade tool: `npx @strapi/upgrade minor`
- [ ] Review changes made by codemods
- [ ] Test application thoroughly
- [ ] **COMMIT CHECKPOINT**: "chore: upgrade to Strapi 4.25.9"

---

## Phase 3: Strapi 5 Automated Migration

### 3.1 Run Strapi 5 Upgrade Tool

```bash
npx @strapi/upgrade major
```

This will:

- Upgrade core Strapi packages to v5
- Install new dependencies (React 18.3, react-router-dom v6, styled-components v6)
- Run automated codemods for:
  - ✅ Comment out lifecycle files (for Document Service migration)
  - ✅ Remove i18n plugin dependency
  - ✅ Upgrade react/react-dom/react-router-dom
  - ✅ Upgrade styled-components (⚠️ note frozen dependency concern)
  - ✅ Migrate helper-plugin usage
  - ✅ Entity Service → Document Service (partial)
  - ✅ SQLite → better-sqlite3
  - ✅ Update @strapi/strapi imports
  - ✅ Utils public interface updates

### 3.2 Review `__TODO__` Markers

- [ ] Search codebase for `__TODO__` comments added by codemods
- [ ] Document each location for manual review

---

## Phase 4: Manual Migration Tasks

### 4.1 Database Configuration Updates

**File: `config/database.js`**

No changes required - PostgreSQL config remains compatible.

✅ Already using `pg` package (compatible)
⚠️ Verify SSL configuration still works with Strapi 5

### 4.2 Lifecycle Hooks Migration

**Critical Change**: Entity Service → Document Service API

#### Files to Update:

1. `src/api/event/content-types/event/lifecycles.js`
2. `src/api/player/content-types/player/lifecycles.js`
3. `src/api/game/content-types/game/lifecycles.js`
4. `src/api/article/content-types/article/lifecycles.js`
5. `src/api/event-location/content-types/event-location/lifecycles.js`

**Migration Pattern:**

```javascript
// OLD (Strapi 4 - Entity Service)
module.exports = {
  beforeCreate(event) {
    validate(event.params.data);
  },
  beforeUpdate(event) {
    validate(event.params.data);
  },
};

// NEW (Strapi 5 - Document Service)
module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    validate(data);
  },
  beforeUpdate(event) {
    const { data } = event.params;
    validate(data);
  },
};
```

**Reference**: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/lifecycle-hooks-document-service

### 4.3 Cron Tasks Migration

**File: `config/cron-tasks.js`**

Update Entity Service calls to Document Service:

```javascript
// Line 8: Replace strapi.entityService with strapi.documents
const events = await strapi.documents("api::event.event").findMany({
  fields: ["id", "name", "end"],
  filters: {
    $and: [
      {
        $or: [{ status: "Open" }, { status: "Announced" }],
      },
      { end: { $lt: now.toISOString() } },
    ],
  },
});

// Line 36: Update entity updates
await strapi.documents("api::event.event").update({
  documentId: event.id,
  data: { status: "Over" },
});
```

**Apply same pattern to `playerPosition` task (lines 48-88)**

### 4.4 Custom Routes & Controllers

**File: `src/api/event/routes/custom-event.js`**

No changes required - route definitions remain compatible.

**Verify controller methods use Document Service if they query data**

### 4.5 Plugin Configuration Updates

#### 4.5.1 CKEditor Configuration

**Major Change**: Configuration moves from `config/plugins.js` to `src/admin/app.tsx`

Create `src/admin/app.tsx`:

```typescript
import { setPluginConfig } from "@_sh/strapi-plugin-ckeditor";

// Move ckeditor5 config from plugins.js here
setPluginConfig({
  presets: [
    // Define your presets
  ],
  theme: {
    // Define theme
  },
});

export default {
  config: {},
  bootstrap() {},
};
```

Remove from `config/plugins.js`:

```javascript
ckeditor5: true,  // DELETE THIS
```

#### 4.5.2 GraphQL Compatibility Mode

**File: `config/plugins.js`**

Add v4 compatibility mode initially:

```javascript
graphql: {
  config: {
    apolloServer: {
      tracing: false,
      introspection: true,
    },
    v4CompatibilityMode: true,  // ADD THIS
  },
},
```

#### 4.5.3 Remove i18n Plugin

**File: `config/plugins.js`**

Remove any explicit i18n configuration (now built-in).

#### 4.5.4 Update Upload Provider

**File: `config/plugins.js`**

Verify Azure Storage provider config - should work as-is with v3.5.0.

### 4.6 Middleware Configuration

**File: `config/middlewares.js`**

Verify CSP configuration compatibility - should remain unchanged.

### 4.7 Update Frozen Dependencies

**File: `package.json`**

⚠️ **CRITICAL DECISION POINT**

Strapi 5 requires:

- react-router-dom: v6.x (currently pinned to v5.3.4)
- styled-components: v6.x (currently pinned to v5.3.11)

**Options:**

1. **Accept upgrades** (recommended for Strapi 5)
   - Test admin panel thoroughly
   - May have breaking changes in custom admin extensions
2. **Investigate compatibility layers**
   - Check if Strapi 5 offers v5 compatibility mode
   - Likely not viable long-term

**Action**: Update README.md to remove frozen dependency warnings for migration.

### 4.8 Environment Variables

**File: `.env.example` & Azure App Settings**

No changes required - all environment variables remain compatible.

---

## Phase 5: Content API Migration

### 5.1 REST API Updates (Frontend Integration)

#### Step 1: Enable Compatibility Mode

No code changes on backend - response format remains same initially.

#### Step 2: Update Frontend (play14-ui)

In `play14-ui` repository, add header to API calls:

```javascript
headers: {
  'Strapi-Response-Format': 'v4'
}
```

#### Step 3: Gradual Migration

- Update queries one-by-one to v5 format
- Test each change
- Remove compatibility header when complete

**Reference**: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/new-response-format

### 5.2 GraphQL API Updates

#### Step 1: Compatibility Mode (Already Set in 4.5.2)

```javascript
v4CompatibilityMode: true;
```

#### Step 2: Update Queries in Frontend

- Review GraphQL query structure changes
- Update mutations
- Test thoroughly

#### Step 3: Disable Compatibility

```javascript
v4CompatibilityMode: false;
```

**Reference**: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/graphql-api-updated

---

## Phase 6: Testing & Validation

### 6.1 Unit Testing

- [ ] Lifecycle hooks generate correct slugs
- [ ] Cron tasks execute successfully (mock time)
- [ ] Custom routes return expected data

### 6.2 Integration Testing

- [ ] Database operations (CRUD)
- [ ] File uploads to Azure Storage
- [ ] GraphQL endpoint queries
- [ ] REST API endpoints

### 6.3 Admin Panel Testing

- [ ] Login/authentication
- [ ] Content-Type Builder
- [ ] Media Library
- [ ] Content Manager (all content types)
- [ ] CKEditor custom field
- [ ] Map field (Mapbox)
- [ ] Country select field
- [ ] Timezone select field
- [ ] Fuzzy search functionality

### 6.4 GitHub Actions Integration

- [ ] `update-static-content` plugin triggers play14-ui build
- [ ] Verify webhook payload structure

### 6.5 Performance Validation

- [ ] Compare response times (v4 vs v5)
- [ ] Memory usage on Azure Container App
- [ ] Build times

---

## Phase 7: Docker & Deployment

### 7.1 Update Dockerfile

- [x] Node 22 (completed in Phase 1)
- [ ] Verify Mapbox token build arg still works
- [ ] Test multi-stage build

### 7.2 Update docker-compose.yml

```yaml
play14-api:
  # Verify Node 22 compatibility
  environment:
    DATABASE_CLIENT: postgres
    # ... rest unchanged
```

### 7.3 Azure Container Apps Deployment

- [ ] Test deployment to staging environment first
- [ ] Monitor Azure Application Insights for errors
- [ ] Verify SSL database connection
- [ ] Check environment variables applied correctly

### 7.4 GitHub Actions Workflow

**File: `.github/workflows/play14-api-aca.yml`**

No changes required - uses Dockerfile which already updated.

---

## Phase 8: Post-Migration Cleanup

### 8.1 Update Documentation

- [ ] Update `.github/copilot-instructions.md`:
  - Change "Strapi v4" → "Strapi 5"
  - Update lifecycle hooks pattern
  - Document Document Service API
  - Update cron behavior notes
  - Remove frozen dependencies section
- [ ] Update `README.md`:
  - Remove "Do not update dependencies" section
  - Add Strapi 5 migration notes
  - Update Node version requirement

### 8.2 Remove Deprecated Code

- [ ] Delete commented-out lifecycle files (if any)
- [ ] Remove old Entity Service references
- [ ] Clean up `__TODO__` markers

### 8.3 Plugin Cleanup

- [ ] Remove unused plugins from `package.json`
- [ ] Verify all plugins are actively used
- [ ] Document plugin versions in copilot instructions

---

## Phase 9: Rollback Strategy

### 9.1 Rollback Triggers

- Database migration failures
- Critical plugin incompatibilities
- Frontend integration breaks
- Azure deployment failures

### 9.2 Rollback Procedure

1. **Code Rollback**

   ```bash
   git checkout main
   git checkout -b rollback/strapi-5-migration
   ```

2. **Database Restore**

   - Restore from Azure PostgreSQL backup
   - Or import: `yarn import`

3. **Deployment Rollback**

   ```bash
   az containerapp revision list -n play14-api -g play14-community
   az containerapp revision activate -n play14-api -g play14-community --revision <previous-revision>
   ```

4. **Revert Node Version**
   - Change `.nvmrc` back to `18`
   - Rebuild Docker image with Node 18

---

## Risk Assessment

### High Risk Items

1. **Document Service Migration** - Lifecycle hooks and cron tasks
   - Mitigation: Thorough testing, manual validation
2. **Frozen Dependencies** - react-router-dom & styled-components
   - Mitigation: Accept upgrades, test admin panel extensively
3. **Plugin Compatibility** - Unknown plugins may break

   - Mitigation: Research each plugin, have alternatives ready

4. **Frontend Integration** - REST/GraphQL API changes
   - Mitigation: Use compatibility mode, gradual migration

### Medium Risk Items

1. **CKEditor Configuration Changes** - New config location
   - Mitigation: Follow official migration guide
2. **Azure Deployment** - Container Apps compatibility

   - Mitigation: Test in staging first

3. **Custom Plugins** - update-static-content hook changes
   - Mitigation: Test webhook thoroughly

### Low Risk Items

1. Node.js 22 upgrade - Well-tested, incremental
2. Database configuration - No changes required
3. Azure Storage provider - Confirmed compatible

---

## Timeline Estimate

| Phase                        | Duration   | Notes                         |
| ---------------------------- | ---------- | ----------------------------- |
| Phase 0: Preparation         | 2-4 hours  | Backups, plugin research      |
| Phase 1: Node.js Upgrade     | 1-2 hours  | Test current app on Node 22   |
| Phase 2: Strapi 4.25.9       | 1 hour     | Minor upgrade                 |
| Phase 3: Automated Migration | 30 mins    | Run upgrade tool              |
| Phase 4: Manual Updates      | 8-12 hours | Lifecycle hooks, cron, config |
| Phase 5: API Migration       | 4-6 hours  | Coordinate with frontend      |
| Phase 6: Testing             | 8-16 hours | Comprehensive validation      |
| Phase 7: Deployment          | 2-4 hours  | Staging → Production          |
| Phase 8: Cleanup             | 2-4 hours  | Documentation, code cleanup   |

**Total: 28-50 hours** (3-6 days of focused work)

---

## Success Criteria

- [x] Node.js 22 running in production
- [ ] Strapi 5.x running in production
- [ ] All content types accessible via admin panel
- [ ] All plugins functional
- [ ] REST & GraphQL APIs returning data
- [ ] Frontend (play14-ui) consuming API successfully
- [ ] File uploads working to Azure Storage
- [ ] Cron jobs executing on schedule
- [ ] GitHub Actions webhook triggering builds
- [ ] No performance degradation
- [ ] Zero data loss
- [ ] Documentation updated

---

## Resources

- **Strapi v4→v5 Migration**: https://docs.strapi.io/cms/migration/v4-to-v5/step-by-step
- **Breaking Changes Database**: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes
- **Document Service API**: https://docs.strapi.io/cms/api/document-service
- **CKEditor Plugin Migration**: https://github.com/nshenderov/strapi-plugin-ckeditor/blob/master/MIGRATION.md
- **Green Apex Migration Guide**: https://www.green-apex.com/how-to-migrate-from-strapi-v4-to-v5

---

## Notes

- **Strapi v4 Support**: Maintained until 2026, no immediate urgency
- **Node.js 22 vs 24**: Node 22 is LTS (until 2027), prefer over Node 24
- **Database**: PostgreSQL compatible, no migration required
- **Azure**: Container Apps, PostgreSQL, Blob Storage - all compatible
- **Frontend**: Coordinate migration with play14-ui repository owner
