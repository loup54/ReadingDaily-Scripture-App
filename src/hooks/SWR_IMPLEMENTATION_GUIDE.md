# Stale-While-Revalidate (SWR) Implementation Guide

**ReadingDaily Scripture App**
**Date**: November 24, 2025

---

## What is Stale-While-Revalidate?

SWR is a caching strategy that provides the best user experience:

1. **Show Cached Data Immediately** (Stale)
   - User sees content instantly (0ms)
   - No loading spinner
   - Responsive feel

2. **Fetch Fresh Data in Background** (Revalidate)
   - App silently fetches latest version
   - User keeps working
   - Non-blocking

3. **Update if Different** (Smart Update)
   - If fresh data differs from cached, update UI
   - Show update badge/notification
   - User stays informed

---

## Why SWR?

### Perfect Balance

| Strategy | Show Cached | Fetch Fresh | UX Feel |
|----------|-----------|------------|---------|
| Cache First | ✅ Instant | ✅ Background | ⭐⭐⭐⭐⭐ Best |
| Network First | ❌ Wait | ✅ Fresh | ⭐⭐⭐ Good |
| Network Only | ❌ Wait | ✅ Fresh | ⭐⭐ Slow |
| **SWR** | **✅ Instant** | **✅ Background** | **⭐⭐⭐⭐⭐ Best** |

### SWR Benefits
- ✅ Instant content display (0ms)
- ✅ Always fetching newest data
- ✅ Works on slow networks
- ✅ Works offline (cached)
- ✅ No loading spinners
- ✅ Professional feel

---

## How It Works

### Visual Flow

```
User opens scripture
  ↓
┌──────────────────────┐
│ Check cache          │
└──────────────────────┘
  ├─ Found? ↓
  │ Display instantly
  │ (0ms response)
  │
  └─ Not found? ↓
    Fetch from network
    Display when ready

Meanwhile (in background)
  ↓
┌──────────────────────┐
│ Fetch fresh data     │
│ (non-blocking)       │
└──────────────────────┘
  ├─ Different from cached? ↓
  │ Update UI
  │ Show "Updated" badge
  │
  └─ Same as cached? ↓
    Silent update (no change)
```

### Data Flow

```
┌─────────────────────────┐
│ Memory Cache            │ (Fast, in-process)
│ (cacheService)          │
└────────────┬────────────┘
             │
             ├─ Have data? → Return immediately
             │               + Fetch in background
             │
             └─ No data? → Check persistent

┌─────────────────────────┐
│ Persistent Storage      │ (Medium, device storage)
│ (storageService)        │
└────────────┬────────────┘
             │
             ├─ Have data? → Return immediately
             │               + Fetch in background
             │
             └─ No data? → Fetch from network

┌─────────────────────────┐
│ Network Fetch           │ (Slow, API call)
│ (API/server)            │
└────────────┬────────────┘
             │
             └─ Update caches + UI
```

---

## Basic Usage

### Simple Scripture View

```typescript
import { useStaleWhileRevalidate } from '@/hooks/useStaleWhileRevalidate';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';

function ScriptureView({ bookId, chapterId }) {
  const { data, isStale, isFetching } = useStaleWhileRevalidate(
    cacheKeys.scripture(bookId, chapterId),
    () => api.fetchScripture(bookId, chapterId),
    { ttl: CACHE_TTL.SCRIPTURE_TEXT }
  );

  return (
    <>
      {data && (
        <>
          <Text>{data.text}</Text>
          {isStale && <Badge>Latest version available</Badge>}
          {isFetching && <Spinner size="small" />}
        </>
      )}
    </>
  );
}
```

### Bookmarks List

```typescript
function BookmarksView() {
  const { data: bookmarks, isFetching } = useStaleWhileRevalidate(
    'bookmarks',
    () => api.fetchBookmarks(),
    {
      ttl: CACHE_TTL.BOOKMARKS,
      showUpdatePrompt: false,
    }
  );

  return (
    <>
      {bookmarks && bookmarks.map(b => <BookmarkItem {...b} />)}
      {isFetching && <Text>Syncing...</Text>}
    </>
  );
}
```

---

## Pre-Configured Hooks

### Scripture Content

```typescript
import { useScriptureWithSWR } from '@/hooks/useStaleWhileRevalidate';

function ReadingView({ bookId, chapterId }) {
  const { data: scripture, isStale, refresh } = useScriptureWithSWR(
    bookId,
    chapterId
  );

  return (
    <>
      {scripture && <Text>{scripture.text}</Text>}
      {isStale && <Button onPress={refresh}>Update</Button>}
    </>
  );
}
```

### Bookmarks

```typescript
import { useBookmarksWithSWR } from '@/hooks/useStaleWhileRevalidate';

function MyBookmarks() {
  const { data: bookmarks, isFetching } = useBookmarksWithSWR();

  return (
    <>
      {bookmarks?.map(id => <BookmarkLink key={id} {...id} />)}
      {isFetching && <SyncIndicator />}
    </>
  );
}
```

### Daily Scripture

```typescript
import { useDailyScriptureWithSWR } from '@/hooks/useStaleWhileRevalidate';

function HomePage() {
  const { data: daily } = useDailyScriptureWithSWR();

  return (
    <>
      <Text>Today's Scripture</Text>
      {daily && <Text>{daily.text}</Text>}
    </>
  );
}
```

---

## Advanced Usage

### With Update Notifications

```typescript
function ScriptureWithUpdates({ bookId, chapterId }) {
  const { data, isStale, refresh, dataVersion } = useStaleWhileRevalidate(
    cacheKeys.scripture(bookId, chapterId),
    () => api.fetchScripture(bookId, chapterId),
    {
      ttl: CACHE_TTL.SCRIPTURE_TEXT,
      onStaleDetected: () => {
        // Show toast notification
        showNotification('Updated version available');
      },
      onSuccess: (data) => {
        // Track update
        analytics.track('scripture_updated', { bookId, chapterId });
      },
    }
  );

  return (
    <>
      {data && <Text>{data.text}</Text>}
      {isStale && (
        <UpdateBanner>
          <Text>New version available</Text>
          <Button onPress={refresh}>Refresh</Button>
        </UpdateBanner>
      )}
      <Text>Version: {dataVersion}</Text>
    </>
  );
}
```

### With Error Handling

```typescript
function SafeScriptureView({ bookId, chapterId }) {
  const { data, loading, error, isFetching, refresh } = useStaleWhileRevalidate(
    cacheKeys.scripture(bookId, chapterId),
    () => api.fetchScripture(bookId, chapterId),
    {
      ttl: CACHE_TTL.SCRIPTURE_TEXT,
      onError: (error) => {
        console.error('Failed to fetch scripture:', error);
      },
    }
  );

  if (loading && !data) {
    return <LoadingSpinner />;
  }

  if (error && !data) {
    return (
      <ErrorView>
        <Text>{error.message}</Text>
        <Button onPress={refresh}>Retry</Button>
      </ErrorView>
    );
  }

  return (
    <>
      {data && <Text>{data.text}</Text>}
      {isFetching && <SyncingBadge />}
    </>
  );
}
```

---

## Response Types

### Hook Returns

```typescript
{
  data: T | null;              // Actual content (stale or fresh)
  loading: boolean;            // Loading on first request
  error: Error | null;         // Any error during fetch
  isStale: boolean;            // Showing cached data (might be stale)
  isFetching: boolean;         // Currently fetching in background
  refresh: () => Promise<void>; // Manual refresh
  dataVersion: number;         // Version counter (increments on update)
}
```

### State Combinations

| State | loading | data | isFetching | isStale | Meaning |
|-------|---------|------|-----------|---------|---------|
| First load | ✅ | ❌ | ❌ | ❌ | Loading... |
| From cache | ❌ | ✅ | ✅ | ✅ | Showing cached, fetching |
| Updated | ❌ | ✅ | ❌ | ❌ | Fresh data, no fetch |
| Error | ❌ | ❌ | ❌ | ❌ | Failed & no cache |

---

## Best Practices

### ✅ DO

1. **Use SWR for most data**
   ```typescript
   // Good - SWR for content
   useStaleWhileRevalidate('key', fetchFn);
   ```

2. **Show update indicators**
   ```typescript
   // Good - inform user
   {isStale && <Badge>Updated</Badge>}
   ```

3. **Handle loading state**
   ```typescript
   // Good - show loading when no cache
   if (loading && !data) return <Spinner />;
   ```

4. **Provide refresh option**
   ```typescript
   // Good - let user refresh
   {isStale && <Button onPress={refresh}>Update</Button>}
   ```

5. **Use pre-configured hooks**
   ```typescript
   // Good - optimized for scripture
   useScriptureWithSWR(bookId, chapterId);
   ```

### ❌ DON'T

1. **Don't show loading spinner for cached data**
   ```typescript
   // Bad - no need to show spinner if we have cached data
   {loading && <Spinner />}

   // Good - only show if no data
   {loading && !data && <Spinner />}
   ```

2. **Don't refetch on every render**
   ```typescript
   // Bad - refetch every time
   useEffect(() => {
     fetchData();
   }); // Missing dependency array

   // Good - fetch only on mount or key change
   useEffect(() => {
     fetchData();
   }, [key]);
   ```

3. **Don't ignore error states**
   ```typescript
   // Bad - ignore error
   {data && <Text>{data.text}</Text>}

   // Good - handle all states
   {data ? <Text>{data.text}</Text> : error ? <Error /> : <Spinner />}
   ```

---

## Common Patterns

### Scripture Reading Flow

```typescript
function ReadingFlow() {
  const { data: scripture, isStale } = useScriptureWithSWR(
    'genesis',
    '1'
  );

  return (
    <ScrollView>
      {scripture && <Text>{scripture.text}</Text>}
      {isStale && (
        <TouchableOpacity
          onPress={() => {
            // Refresh this scripture
          }}
        >
          <Text>Tap to see latest version</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
```

### Bookmarks with Sync Indicator

```typescript
function BookmarksView() {
  const { data: bookmarks, isFetching } = useBookmarksWithSWR();

  return (
    <FlatList
      data={bookmarks}
      renderItem={({ item }) => <BookmarkItem {...item} />}
      ListEmptyComponent={<Text>No bookmarks yet</Text>}
      ListFooterComponent={isFetching && <SyncIndicator />}
    />
  );
}
```

### Daily Scripture Home Screen

```typescript
function HomeScreen() {
  const { data: daily } = useDailyScriptureWithSWR();

  return (
    <SafeAreaView>
      <Text>Today's Reading</Text>
      {daily ? (
        <>
          <Text style={{ fontSize: 24 }}>{daily.text}</Text>
          <Text>{daily.bookId} {daily.chapterId}</Text>
        </>
      ) : (
        <Spinner />
      )}
    </SafeAreaView>
  );
}
```

---

## Comparison with Other Strategies

### Cache First vs SWR

**Cache First**:
```typescript
// Show cached, fetch in background
// Good for static content (scripture text)
useStaleWhileRevalidate(key, fetch, { ttl: 24h });
```

**Network First**:
```typescript
// Fetch fresh, fallback to cache
// Good for fresh data (user profile)
useCachedData(key, fetch, { strategy: 'network_first' });
```

**SWR** (Best of both):
```typescript
// Show cached instantly, fetch fresh in background
// Good for most data types
useStaleWhileRevalidate(key, fetch);
```

---

## Performance Characteristics

### Response Time

```
First Load:
  No cache → Fetch from network → 300-500ms

Subsequent Loads (with SWR):
  Show cached → Fetch in background → 0-50ms

Update Notification:
  Data changed → Show badge/prompt → Instant
```

### Network Usage

```
With SWR:
  Memory cache hit: No network (0 bytes)
  Storage cache hit: Storage read + network fetch (300-500 bytes)
  Network fetch: Full request/response cycle

Without SWR (Network First):
  Every navigation: Full network request (~500-1000 bytes)

Result: SWR saves bandwidth on repeat views
```

### Battery Impact

```
Background fetch: ~5-10mA per request
UI update: Minimal when data unchanged
Spinner removed: Saves ~20-30mA (no animation)

Result: SWR is battery efficient
```

---

## Configuration Options

```typescript
useStaleWhileRevalidate(key, fetchFn, {
  // Time before cache expires (milliseconds)
  ttl: 24 * 60 * 60 * 1000,

  // Save to device storage (survives app restart)
  persistent: true,

  // Show update notification when data changes
  showUpdatePrompt: true,

  // Called when fresh data successfully loaded
  onSuccess: (data) => { },

  // Called if revalidation fails
  onError: (error) => { },

  // Called when stale data detected
  onStaleDetected: () => { },
});
```

---

## Debugging

### Monitor SWR Behavior

```typescript
const { data, isStale, isFetching, dataVersion } = useStaleWhileRevalidate(
  key,
  fetchFn
);

// Log SWR lifecycle
useEffect(() => {
  if (isFetching) {
    console.log('[SWR] Revalidating...', key);
  }
}, [isFetching]);

useEffect(() => {
  if (isStale) {
    console.log('[SWR] Stale data detected', key, dataVersion);
  }
}, [isStale, dataVersion]);

useEffect(() => {
  if (data) {
    console.log('[SWR] Data loaded', key, data);
  }
}, [data]);
```

---

## Migration Guide

### From useCachedData

**Before**:
```typescript
const { data, loading } = useCachedData(key, fetchFn, {
  strategy: 'cache_first',
});
```

**After**:
```typescript
const { data, loading } = useStaleWhileRevalidate(key, fetchFn);
```

### From Manual Caching

**Before**:
```typescript
const [data, setData] = useState(null);

useEffect(() => {
  const cached = cache.get(key);
  if (cached) {
    setData(cached);
  }
  fetchData().then(data => {
    setData(data);
    cache.set(key, data);
  });
}, [key]);
```

**After**:
```typescript
const { data } = useStaleWhileRevalidate(key, fetchData);
```

---

## Checklist

- [ ] Using SWR for all main content (scripture, bookmarks, etc.)
- [ ] Handling loading state (show spinner only if no cached data)
- [ ] Handling error state
- [ ] Showing update indicators when data changes
- [ ] Using pre-configured hooks where available
- [ ] Respecting TTL values for different data types
- [ ] Testing in slow network conditions
- [ ] Testing offline scenarios
- [ ] Monitoring background fetch behavior
- [ ] Documenting stale data handling in components

---

**Status**: ✅ **Phase 4 Ready**
**Performance Impact**: Best UX + Fast Speed + Good Battery Life

