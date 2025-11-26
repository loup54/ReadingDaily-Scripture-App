# Cache Strategy Guide

**ReadingDaily Scripture App - Performance Perception Phase 1**
**Date**: November 24, 2025

---

## Overview

This document defines the caching strategy for different data types in the app. Each data type has an optimal cache TTL and strategy.

---

## Cache Strategies

### 1. Cache First (Cache Preferred)
**Use for**: Static content that rarely changes

```
Return cached immediately
↓
Fetch fresh in background
↓
If different, update cache
```

**Best for**: Scripture text, book lists, chapter lists
**Pros**: Instant response, no waiting
**Cons**: Might show stale data briefly

**Configuration**:
```typescript
const { data } = useCachedData('scripture_123', fetchScripture, {
  strategy: 'cache_first',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});
```

---

### 2. Network First (Network Preferred)
**Use for**: Data that changes frequently

```
Fetch fresh first
↓
If success, return fresh + cache
↓
If fail, return cached fallback
```

**Best for**: User profile, preferences, settings
**Pros**: Always fresh, graceful fallback
**Cons**: Network latency, slower on poor networks

**Configuration**:
```typescript
const { data } = useCachedData('user_profile', fetchProfile, {
  strategy: 'network_first',
  ttl: 4 * 60 * 60 * 1000, // 4 hours
});
```

---

### 3. Stale While Revalidate (Recommended)
**Use for**: Most data types - balances freshness and speed

```
Return cached immediately
↓
User sees content
↓
Fetch fresh in background
↓
If different, silently update
↓
Show "Updated" indicator
```

**Best for**: Bookmarks, notes, highlights, user data
**Pros**: Instant display, always updating, best UX
**Cons**: Might show stale data momentarily

**Configuration**:
```typescript
const { data, isStale } = useCachedData(
  'bookmarks',
  fetchBookmarks,
  {
    strategy: 'stale_while_revalidate',
    ttl: 1 * 60 * 60 * 1000, // 1 hour
  }
);
```

---

### 4. Network Only (No Cache)
**Use for**: Time-sensitive data

```
Always fetch fresh
↓
No fallback to cache
```

**Best for**: Real-time data, one-time operations
**Pros**: Always fresh
**Cons**: No offline support, slowest

**Configuration**:
```typescript
const { data } = useCachedData('live_data', fetchLiveData, {
  strategy: 'network_only',
});
```

---

### 5. Cache Only (Offline)
**Use for**: Offline-first features

```
Return cached
↓
Never fetch
```

**Best for**: Offline reading, cached content
**Pros**: No network needed, instant
**Cons**: Can't update, need to preload

**Configuration**:
```typescript
const { data } = useCachedData('offline_scripture', fetchScripture, {
  strategy: 'cache_only',
});
```

---

## Data Type Cache Strategy Matrix

| Data Type | Strategy | TTL | Persistent | Use Case |
|-----------|----------|-----|-----------|----------|
| Scripture Text | cache_first | 24h | ✅ Yes | Content rarely changes |
| Chapter List | cache_first | 12h | ✅ Yes | Navigation structure |
| Book List | cache_first | 7d | ✅ Yes | Static structure |
| Bookmarks | swr | 1h | ✅ Yes | User might change elsewhere |
| Notes | swr | 1h | ✅ Yes | Need to sync |
| Highlights | swr | 1h | ✅ Yes | Need to sync |
| Ratings | swr | 1h | ✅ Yes | Need to sync |
| User Profile | network_first | 4h | ✅ Yes | Might change elsewhere |
| Preferences | network_first | 7d | ✅ Yes | Less frequent changes |
| Audio Metadata | cache_first | 7d | ✅ Yes | Static metadata |
| Daily Scripture | swr | 24h | ✅ Yes | Changes daily |
| Search Index | cache_first | 24h | ✅ Yes | Rarely changes |

---

## Implementation Examples

### Scripture Reading

```typescript
// Always show cached text immediately
const { data: scripture, isStale } = useCachedData(
  cacheKeys.scripture(bookId, chapterId),
  () => api.fetchScripture(bookId, chapterId),
  {
    strategy: 'cache_first', // Fast display
    ttl: CACHE_TTL.SCRIPTURE_TEXT,
    persistent: true,
  }
);

return (
  <>
    {scripture && <Text>{scripture.text}</Text>}
    {isStale && <Badge>Updated</Badge>}
  </>
);
```

---

### Bookmarks List

```typescript
// Show cached bookmarks immediately, sync in background
const { data: bookmarks, isFetching } = useCachedData(
  cacheKeys.bookmarks(),
  () => api.fetchBookmarks(),
  {
    strategy: 'stale_while_revalidate', // Fast + fresh
    ttl: CACHE_TTL.BOOKMARKS,
    persistent: true,
  }
);

return (
  <>
    {bookmarks?.map(b => <BookmarkItem key={b.id} {...b} />)}
    {isFetching && <Text>Syncing...</Text>}
  </>
);
```

---

### User Profile

```typescript
// Fetch fresh profile, fallback to cache
const { data: profile, loading } = useCachedData(
  cacheKeys.profile(),
  () => api.fetchProfile(),
  {
    strategy: 'network_first', // Fresh preferred
    ttl: CACHE_TTL.USER_PROFILE,
    persistent: true,
  }
);

return loading ? <LoadingSpinner /> : <ProfileView {...profile} />;
```

---

### Offline Reading

```typescript
// Use only cached scripture for offline
const { data: scripture, error } = useCachedData(
  cacheKeys.scripture(bookId, chapterId),
  () => api.fetchScripture(bookId, chapterId),
  {
    strategy: 'cache_only', // No network
    ttl: CACHE_TTL.SCRIPTURE_TEXT,
  }
);

if (error) {
  return <Text>Not available offline</Text>;
}

return <Text>{scripture.text}</Text>;
```

---

## Cache Key Patterns

Use standard cache key builder to avoid collisions:

```typescript
import { cacheKeys } from '@/utils/cacheUtils';

// Scripture
cacheKeys.scripture(bookId, chapterId, verseId)
// → 'scripture_gen_1_1'

// Bookmarks
cacheKeys.bookmarks()
// → 'bookmarks'

// Notes for verse
cacheKeys.notes('gen_1_1')
// → 'notes_gen_1_1'

// Daily scripture
cacheKeys.dailyScripture()
// → 'daily_Mon Nov 24 2025'
```

---

## TTL Duration Guide

| Duration | Use Case |
|----------|----------|
| 1 hour | User-generated data (notes, bookmarks) |
| 4 hours | Profile/settings |
| 12 hours | Navigation structure (chapters) |
| 24 hours | Scripture text, daily content |
| 7 days | Book lists, preferences |

---

## Usage in Components

### Basic Pattern

```typescript
import { useCachedData } from '@/hooks/useCachedData';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';

function ScriptureView({ bookId, chapterId }) {
  const { data, loading, error, refresh, isStale } = useCachedData(
    cacheKeys.scripture(bookId, chapterId),
    () => api.fetchScripture(bookId, chapterId),
    {
      ttl: CACHE_TTL.SCRIPTURE_TEXT,
      persistent: true,
    }
  );

  if (loading && !data) {
    return <LoadingSpinner />;
  }

  if (error && !data) {
    return <ErrorView onRetry={refresh} />;
  }

  return (
    <>
      {data && <Text>{data.text}</Text>}
      {isStale && <UpdateBadge />}
    </>
  );
}
```

---

## Error Handling

```typescript
const { data, error, loading, refresh } = useCachedData(
  'key',
  fetchFn,
  {
    onError: (err) => {
      // Handle error
      console.error('Fetch failed:', err);
      // Show snackbar/toast
    },
    onSuccess: (data) => {
      // Data loaded successfully
      console.log('Data loaded:', data);
    },
  }
);
```

---

## Performance Monitoring

### Check Cache Stats

```typescript
import { cacheService } from '@/services/cacheService';

// Get cache statistics
const stats = cacheService.getStats();
console.log(`Cache: ${stats.total} entries, ${stats.memorySize} bytes`);

// Check specific key
const ttl = cacheService.getTTL('scripture_gen_1');
const age = cacheService.getAge('scripture_gen_1');
```

### Monitor Storage

```typescript
import { storageService } from '@/services/storageService';

// Get storage stats
const stats = await storageService.getStats();
console.log(`Storage: ${stats.size} bytes used`);

// Get available space
const available = await storageService.getAvailablePercentage();
console.log(`Storage available: ${available}%`);
```

---

## Best Practices

### ✅ DO

1. **Use cache keys consistently**
   ```typescript
   // Good
   cacheKeys.scripture(bookId, chapterId);
   ```

2. **Set appropriate TTL**
   ```typescript
   // Good - 24 hours for scripture
   ttl: CACHE_TTL.SCRIPTURE_TEXT,
   ```

3. **Use persistent caching for important data**
   ```typescript
   // Good - persist user data
   persistent: true,
   ```

4. **Handle loading and error states**
   ```typescript
   if (loading) return <LoadingSpinner />;
   if (error && !data) return <ErrorView />;
   ```

### ❌ DON'T

1. **Don't hardcode cache keys**
   ```typescript
   // Bad
   'scripture_123'

   // Good
   cacheKeys.scripture('gen', '1')
   ```

2. **Don't use same TTL for all data**
   ```typescript
   // Bad - same TTL for different data types
   ttl: 60 * 60 * 1000,

   // Good - appropriate TTL per type
   ttl: CACHE_TTL.SCRIPTURE_TEXT,
   ```

3. **Don't skip error handling**
   ```typescript
   // Bad
   <Text>{data.text}</Text>

   // Good
   {data && <Text>{data.text}</Text>}
   {error && <ErrorView />}
   ```

---

## Debugging

### Enable Debug Logging

```typescript
// In development, log cache operations
if (__DEV__) {
  const { data } = useCachedData('key', fetchFn, {
    onSuccess: (data) => {
      console.log('[Cache] Loaded:', data);
    },
  });
}
```

### Inspect Cache

```typescript
// Chrome DevTools console
// View cache service
cacheService.getStats()

// View storage
storageService.getStats()
```

---

## Migration Guide

### From No Caching to Caching

**Before**:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, []);
```

**After**:
```typescript
const { data, loading } = useCachedData(
  'cache_key',
  fetchData,
  { ttl: 24 * 60 * 60 * 1000 }
);
```

---

## Phase 1 Summary

### Created Files
- ✅ `cacheService.ts` - In-memory cache
- ✅ `storageService.ts` - Persistent cache
- ✅ `cacheUtils.ts` - Utilities and constants
- ✅ `useCachedData.ts` - React hook

### Ready for Phase 2
Next phase will implement optimistic updates using this cache foundation.

---

**Status**: ✅ Phase 1 Complete
**Ready for**: Phase 2 (Optimistic Updates)

