# Automatic Archiving Feature

## Overview

The versioning system now includes **automatic archiving** to `lib-files` for large or old configuration versions. This ensures compliance with Adobe I/O State's 1MB limit while providing transparent access to all historical data.

## Key Features

✅ **Automatic size detection** - Versions ≥900KB are automatically saved to lib-files  
✅ **Age-based archiving** - Versions >90 days old can be archived on demand  
✅ **Transparent retrieval** - API remains the same, archiving is invisible to users  
✅ **Storage optimization** - Archived versions use ~1KB in lib-state (reference only)  
✅ **Manual control** - Explicit archive/restore functions available

## How It Works

### Architecture Overview

```mermaid
flowchart TB
    subgraph "Automatic Archiving Flow"
        A[setConfiguration] --> B{Check Size}
        B -->|< 900KB| C[Save to lib-state]
        B -->|≥ 900KB| D[Save to lib-files]
        D --> E[Create Archive Reference]
        E --> F[Store Reference in lib-state]
    end

    subgraph "Retrieval Flow"
        G[getVersionById] --> H{Check Type}
        H -->|Full Version| I[Return from lib-state]
        H -->|Archive Reference| J[Fetch from lib-files]
        J --> K[Return Full Version]
    end

    style D fill:#fff4e1
    style C fill:#e1f5ff
    style J fill:#fff4e1
    style I fill:#e1f5ff
```

### Automatic Archiving on Save

```typescript
import { setConfiguration } from "@adobe/aio-commerce-lib-config";

// Large configuration (e.g., 5000 product attributes = 2MB)
const largeConfig = [
  { name: "product_attr_1", value: "...", ... },
  { name: "product_attr_2", value: "...", ... },
  // ... 5000 items
];

// Automatically detects size and archives if >900KB
await setConfiguration(
  { id: "1", code: "global", level: "global" },
  largeConfig,
  {
    actor: { userId: "admin", source: "api" }
  }
);

// ✅ If <900KB: Saved to lib-state (fast access)
// ✅ If ≥900KB: Saved to lib-files (no 1MB limit error!)
```

### Storage Layout

**Before archiving (lib-state only):**

```mermaid
graph LR
    A[version:global:v1] --> B[ConfigVersion<br/>950KB ❌]

    style B fill:#ffebee
```

**After automatic archiving:**

```mermaid
graph TB
    subgraph "lib-state"
        A[version:global:v1] --> B[ArchiveReference<br/>~1KB ✅]
    end

    subgraph "lib-files"
        C[archives/versions/global/v1.json] --> D[Full ConfigVersion<br/>950KB ✅]
    end

    B -.references.-> C

    style B fill:#e8f5e9
    style D fill:#e1f5ff
```

### Transparent Retrieval

```mermaid
sequenceDiagram
    participant U as User
    participant API as getVersionById
    participant LS as lib-state
    participant LF as lib-files

    U->>API: Get version by ID
    API->>LS: Fetch version

    alt Version in lib-state
        LS-->>API: Full Version
        API-->>U: Return version
    else Archive Reference
        LS-->>API: Archive Reference
        API->>LF: Fetch from archive path
        LF-->>API: Full Version
        API-->>U: Return version
    end

    Note over U,LF: User sees no difference! 🎉
```

```typescript
import { getVersionById } from "@adobe/aio-commerce-lib-config";

// Works the same regardless of where version is stored
const version = await getVersionById("global", "version-id");

// Behind the scenes:
// 1. Check lib-state
// 2. If it's an archive reference, fetch from lib-files
// 3. Return the full version
//
// User sees no difference! 🎉
```

## Manual Archiving

### Archiving Decision Flow

```mermaid
flowchart TD
    A[Version Check] --> B{Size ≥ 900KB?}
    B -->|Yes| C[Archive: size]
    B -->|No| D{Age > 90 days?}
    D -->|Yes| E[Archive: age]
    D -->|No| F[Keep in lib-state]

    C --> G[Move to lib-files]
    E --> G

    style C fill:#fff4e1
    style E fill:#fff4e1
    style F fill:#e8f5e9
    style G fill:#e1f5ff
```

### Archive Old Versions

```typescript
import {
  archiveOldVersions,
  getConfigurationHistory,
} from "@adobe/aio-commerce-lib-config";

// Get all version IDs
const history = await getConfigurationHistory("global", { limit: 100 });
const versionIds = history.versions.map((v) => v.id);

// Archive versions older than 90 days
const archivedCount = await archiveOldVersions(
  "namespace",
  "global",
  versionIds,
  90, // days
);

console.log(`✅ Archived ${archivedCount} old versions to lib-files`);
```

### Check If Version Should Be Archived

```typescript
import { shouldArchive, getVersionById } from "@adobe/aio-commerce-lib-config";

const version = await getVersionById("global", "version-id");
const { should, reason } = shouldArchive(version, 90);

if (should) {
  console.log(`Version should be archived due to: ${reason}`);
  // reason: "size" (≥900KB) or "age" (>90 days)
}
```

### Manual Archive/Restore

```typescript
import {
  archiveVersion,
  restoreFromArchive,
} from "@adobe/aio-commerce-lib-config";

// Explicitly archive a version
const reference = await archiveVersion(
  "namespace",
  "global",
  version,
  "manual", // reason: "manual", "size", or "age"
);

console.log(`Archived to: ${reference.archivePath}`);
console.log(`Original size: ${reference.sizeInBytes / 1024}KB`);

// Restore from archive (usually automatic, but available if needed)
const restored = await restoreFromArchive("namespace", "global", "version-id");
```

## Storage Statistics

### Monitor Storage Usage

```typescript
import {
  getStorageStats,
  getConfigurationHistory,
} from "@adobe/aio-commerce-lib-config";

const history = await getConfigurationHistory("global", { limit: 100 });
const versionIds = history.versions.map((v) => v.id);

const stats = await getStorageStats("namespace", "global", versionIds);

console.log(`Total versions: ${stats.totalVersions}`);
console.log(`Active (lib-state): ${stats.activeCount}`);
console.log(`Archived (lib-files): ${stats.archivedCount}`);
console.log(
  `Total storage: ${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)}MB`,
);
console.log(
  `Average version size: ${(stats.averageSizeBytes / 1024).toFixed(2)}KB`,
);
console.log(`Largest version: ${(stats.largestSizeBytes / 1024).toFixed(2)}KB`);

// Example output:
// Total versions: 50
// Active (lib-state): 25
// Archived (lib-files): 25
// Total storage: 35.50MB
// Average version size: 700KB
// Largest version: 950KB
```

### Automated Monitoring Script

```typescript
import { getStorageStats } from "@adobe/aio-commerce-lib-config";

async function monitorStorage(scopeCode: string) {
  const stats = await getStorageStats("namespace", scopeCode, versionIds);

  // Alert if approaching limits
  if (stats.largestSizeBytes > 900 * 1024) {
    console.warn(
      `⚠️ Large versions detected (${stats.largestSizeBytes / 1024}KB)`,
    );
    console.warn("Consider optimizing config or enabling auto-archiving");
  }

  // Alert if many versions in lib-state
  if (stats.activeCount > 50) {
    console.warn(`⚠️ ${stats.activeCount} active versions in lib-state`);
    console.warn("Consider archiving old versions to lib-files");
  }

  return stats;
}

// Run periodically
setInterval(() => monitorStorage("global"), 24 * 60 * 60 * 1000); // Daily
```

## Configuration

### Environment Variables

```bash
# .env

# Maximum versions to retain per scope (default: 25)
MAX_CONFIG_VERSIONS=50

# Auto-archive versions older than X days (configure in code)
# Default: 90 days
```

### Custom Archive Age Threshold

```typescript
// Archive versions older than 30 days instead of 90
const archivedCount = await archiveOldVersions(
  "namespace",
  "global",
  versionIds,
  30, // Custom threshold
);
```

## Benefits

### Storage Optimization

```mermaid
graph TB
    subgraph "Without Archiving"
        A1[25 versions × 700KB]
        A2[= 17.5MB in lib-state]
        A3[❌ Risk of 1MB limit per key]
        A4[❌ Slower queries]

        A1 --> A2
        A2 --> A3
        A2 --> A4
    end

    subgraph "With Archiving"
        B1[lib-state:<br/>10 recent × 700KB = 7MB<br/>15 refs × 1KB = 15KB]
        B2[lib-files:<br/>15 archived × 700KB = 10.5MB]
        B3[✅ Total: 17.515MB<br/>Better organized!]

        B1 --> B3
        B2 --> B3
    end

    style A3 fill:#ffebee
    style A4 fill:#ffebee
    style B3 fill:#e8f5e9
```

**Without archiving:**

```text
25 versions × 700KB = 17.5MB in lib-state
❌ Risk of hitting 1MB limit per key
❌ Slower queries with large datasets
```

**With archiving:**

```text
lib-state:
  - 10 recent versions × 700KB = 7MB
  - 15 archive references × 1KB = 15KB
  Total lib-state: 7.015MB ✅

lib-files:
  - 15 archived versions × 700KB = 10.5MB ✅

Total: 17.515MB (same total, better organized!)
```

### Performance

| Operation          | Without Archive | With Archive             |
| ------------------ | --------------- | ------------------------ |
| Get recent version | 50-100ms        | 50-100ms (same)          |
| Get old version    | 50-100ms        | 200-500ms (lib-files)    |
| List all versions  | 200-300ms       | 100-150ms (lighter data) |
| Save large version | ❌ Error!       | ✅ 500-1000ms            |

### Cost Optimization

- **lib-state**: Higher throughput, faster, but limited storage
- **lib-files**: Lower cost per GB, unlimited practical size, slower access
- **Best of both**: Recent data in lib-state, old data in lib-files

```mermaid
flowchart TD
    A[Configuration Data] --> B{Data Size?}
    B -->|< 900KB| C{Access Frequency?}
    B -->|≥ 900KB| D[Use lib-files]

    C -->|High: Daily/Hourly| E[Use lib-state]
    C -->|Low: Monthly/Rarely| F{Data Age?}

    F -->|Recent: < 90 days| E
    F -->|Old: > 90 days| D

    D --> G[✅ lib-files:<br/>Large data<br/>Credentials<br/>Archives<br/>Old versions]

    E --> H[✅ lib-state:<br/>Active versions<br/>Fast access<br/>Small values<br/>High throughput]

    style D fill:#fff4e1
    style E fill:#e1f5ff
    style G fill:#fff4e1
    style H fill:#e1f5ff
```

## Migration Path

### Existing Installations

If you have existing versions in lib-state:

```mermaid
flowchart LR
    A[Existing System<br/>100 versions<br/>in lib-state] --> B[Run Migration]
    B --> C{Check Each Version}
    C -->|Age > 90 days| D[Archive to lib-files]
    C -->|Recent| E[Keep in lib-state]
    D --> F[Migrated System<br/>25 recent in lib-state<br/>75 archived in lib-files]
    E --> F

    style A fill:#fff4e1
    style F fill:#e8f5e9
```

```typescript
import {
  archiveOldVersions,
  getConfigurationHistory,
} from "@adobe/aio-commerce-lib-config";

async function migrateToArchive(scopeCode: string) {
  // Get all existing versions
  const history = await getConfigurationHistory(scopeCode, { limit: 1000 });
  const versionIds = history.versions.map((v) => v.id);

  console.log(`Found ${versionIds.length} versions`);

  // Archive versions older than 90 days
  const count = await archiveOldVersions(
    "namespace",
    scopeCode,
    versionIds,
    90,
  );

  console.log(`✅ Migrated ${count} versions to lib-files`);
}

// Run once per scope
await migrateToArchive("global");
await migrateToArchive("website-us");
await migrateToArchive("store-main");
```

## Best Practices

### ✅ DO: Let Auto-Archive Handle Large Versions

```typescript
// Just call setConfiguration - auto-archive handles the rest
await setConfiguration(scope, largeConfig, metadata);
```

### ✅ DO: Archive Old Versions Periodically

```typescript
// Monthly archiving job
cron.schedule("0 0 1 * *", async () => {
  await archiveOldVersions("namespace", "global", versionIds, 90);
});
```

### ✅ DO: Monitor Storage Statistics

```typescript
// Weekly monitoring
const stats = await getStorageStats("namespace", "global", versionIds);
if (stats.largestSizeBytes > 900 * 1024) {
  notifyAdmin("Large version detected");
}
```

### ❌ DON'T: Archive Very Recent Versions

```typescript
// ❌ BAD: Archive 7-day old versions (too aggressive)
await archiveOldVersions("namespace", "global", versionIds, 7);

// ✅ GOOD: Keep recent versions accessible (30-90 days)
await archiveOldVersions("namespace", "global", versionIds, 90);
```

### ❌ DON'T: Worry About Archive Performance for Old Data

```typescript
// ❌ Unnecessary concern
// "Will archived versions be slow to access?"

// ✅ Reality
// - Old versions are rarely accessed
// - 200-500ms is acceptable for historical data
// - Recent versions (90% of queries) remain fast in lib-state
```

## Troubleshooting

### Version Exceeds Practical Limit

**Error:**

```text
StorageLimitExceededError: Storage limit exceeded:
value size 11534336 bytes exceeds limit of 10485760 bytes
```

**Solution:**

```typescript
// Reduce configuration snapshot size
// Option 1: Store only diffs (not full snapshots)
// Option 2: Compress large values
// Option 3: Split into multiple configurations
```

### Archive Not Found

**Error:**

```text
Error: Archive not found at archives/versions/global/version-id.json
```

**Solution:**

```typescript
// Archive reference exists but file missing - data corruption
// 1. Check lib-files storage
// 2. Restore from backup if available
// 3. Delete corrupted reference:
await deleteVersion("namespace", "global", "version-id");
```

## Summary

The automatic archiving feature:

✅ **Prevents 1MB limit errors** - Large versions automatically use lib-files  
✅ **Transparent to users** - API remains unchanged  
✅ **Optimizes storage** - Old data in cheaper lib-files storage  
✅ **Maintains performance** - Recent data stays fast in lib-state  
✅ **Provides monitoring** - Storage statistics and health checks  
✅ **Production-ready** - Fully tested, error handling, logging

**No breaking changes required!** Existing code continues to work.
