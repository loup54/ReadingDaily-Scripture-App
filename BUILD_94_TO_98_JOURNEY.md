# Build 94-98 Journey: Fixing Payment Service Initialization

**Date**: February 6-7, 2026
**Issue**: "Payment service not initialized" errors preventing in-app purchases
**Resolution**: Multi-build investigation and fix progression

---

## Timeline Overview

| Build | Date | Change | Result |
|-------|------|--------|--------|
| 94 | Feb 6 | Added `isInitialized` flag | Still failed - early return blocked auto-init |
| 95 | Feb 6 | Added auto-init with try-catch | Still failed - blocked by useTrialStore |
| 96 | Feb 7 | Removed blocking null checks | Still failed - reached wrong API |
| 97 | Feb 7 | **Fixed getProducts() API** | **SHOULD WORK** ✅ |
| 98 | Feb 7 | Build number increment | Same as 97 |

---

## Build 94: Initial Investigation

**Commit**: `46eccfc` - Update CFBundleVersion to 94 in Info.plist

### Problem Identified
Console.app logs showed payment service failing silently with no error details.

### Solution Attempted
Added `isInitialized` boolean flag to track initialization state:

```typescript
// src/services/payment/AppleIAPService.ts
private isInitialized: boolean = false;

async initialize(): Promise<void> {
  try {
    await RNIap.initConnection();
    await this.loadProducts();

    this.isInitialized = true; // ✅ Set on success
  } catch (error) {
    this.isInitialized = false; // ❌ Reset on failure
    throw error;
  }
}
```

### Result
- ❌ Failed - early return in `purchase()` blocked any recovery attempt
- Error message remained generic: "Payment service not initialized"

---

## Build 95: Auto-Initialization with Error Handling

**Commit**: `1a6df76` - Add proper error handling to auto-initialization

### Problem Analysis
Build 94's check threw error immediately without attempting to initialize.

### Solution Attempted
Added auto-initialization in `purchase()` method:

```typescript
// src/services/payment/AppleIAPService.ts (lines 134-150)
async purchase(productId: string): Promise<PaymentResult> {
  // Auto-initialize if not already initialized
  if (!this.isInitialized) {
    console.log('⚠️ [IAP] Service not initialized, auto-initializing...');
    try {
      await this.initialize();

      // Verify initialization actually succeeded
      if (!this.isInitialized) {
        throw new Error('Initialization completed but isInitialized flag not set');
      }

      console.log('✅ [IAP] Auto-initialization successful');
    } catch (error) {
      console.error('❌ [IAP] Auto-initialization failed:', error);
      throw new Error(`Unable to initialize payment service: ${error.message}`);
    }
  }

  // Continue with purchase...
}
```

### Result
- ❌ Still failed - never reached this code
- Blocked at store layer before AppleIAPService

---

## Build 96: Remove Store-Level Blocking

**Commit**: `c8c699f` - Remove blocking null checks, allow AppleIAPService auto-init

### Problem Discovery
The error was thrown in `useTrialStore.ts` BEFORE reaching AppleIAPService:

```typescript
// src/stores/useTrialStore.ts (OLD - Build 95)
purchaseLifetimeAccess: async (): Promise<boolean> => {
  const state = get();

  if (!state.paymentService) {
    throw new Error('Payment service not initialized'); // ❌ BLOCKED HERE
  }

  // Build 95's auto-init never reached
  const result = await state.paymentService.purchase(...);
}
```

### Solution Applied
Changed all three purchase methods in useTrialStore:
- `purchaseLifetimeAccess()`
- `restorePurchase()`
- `upgradeToBasic()`

**New approach**: Try to initialize instead of throwing:

```typescript
// src/stores/useTrialStore.ts (NEW - Build 96)
purchaseLifetimeAccess: async (): Promise<boolean> => {
  const state = get();

  // REMOVED: Blocking null check

  // If paymentService is null, create it now
  if (!state.paymentService) {
    console.warn('⚠️ Payment service not initialized, creating now...');
    await get()._initializePaymentService();

    const updatedState = get();
    if (!updatedState.paymentService) {
      throw new Error('Failed to initialize payment service');
    }
  }

  // Now reaches AppleIAPService.purchase() which has auto-init
  const result = await get().paymentService!.purchase(...);
}
```

### Result
- ❌ Still failed - but now reached AppleIAPService
- New error revealed: Products not loading from App Store Connect

---

## Build 97: THE ROOT CAUSE FIX

**Commit**: `707f075` - Fix react-native-iap v14 API - getProducts() takes array directly

### Problem Discovered
Wrong API syntax for react-native-iap v14.x:

```typescript
// ❌ WRONG - Build 96 and earlier
const products = await RNIap.getProducts({ skus: PRODUCT_IDS });
// This API was deprecated in v14.x
// Returned undefined or threw error
// Left this.products = []
```

### Solution Applied
One line fix - use correct v14.x API:

```typescript
// ✅ CORRECT - Build 97
const products = await RNIap.getProducts(PRODUCT_IDS);
// v14.x takes array directly, not wrapped in object
```

**File**: `src/services/payment/AppleIAPService.ts:479`

### Why This Was The Root Cause

1. **Initialization Flow**:
   ```
   App Start → initializeTrial() → _initializePaymentService()
     → AppleIAPService.initialize()
       → RNIap.initConnection() ✅
       → loadProducts() ❌ FAILED HERE
         → getProducts({ skus: [...] }) // Wrong API
         → Returns undefined/error
         → this.products stays []
       → this.isInitialized = true (WRONG!)
   ```

2. **Purchase Attempt**:
   ```
   User taps Purchase → purchaseLifetimeAccess()
     → Checks paymentService exists ✅
     → Calls paymentService.purchase()
       → Auto-init check: isInitialized = true ✅
       → Looks for product in this.products
       → Product not found (products = [])
       → Throws "Product not found"
   ```

3. **The Cascade**:
   - Wrong API → Products don't load
   - Products don't load → Empty products array
   - Empty array → Product lookup fails
   - Product lookup fails → Purchase fails
   - But initialization marked as "successful"!

### Expected Result
- ✅ Products should load from App Store Connect
- ✅ Initialization should complete successfully
- ✅ Purchases should work

---

## Build 98: Build Number Increment

**Commit**: `e49e563` - Build 98: Increment build number

### Changes
- Updated build number from 97 to 98
- No code changes
- Identical functionality to Build 97

### Reason
Build 97 was built twice accidentally. Build 98 ensures unique build number.

---

## Technical Details

### Product IDs Configuration
```typescript
// src/services/payment/AppleIAPService.ts:30-35
const PRODUCT_IDS = [
  'com.readingdaily.lifetime.access.v2',
  'com.readingdaily.basic.monthly.v2',
  'com.readingdaily.basic.yearly.v2',
];
```

### react-native-iap Version
- **Installed**: 14.7.6
- **Latest**: 14.7.8
- **Breaking Change**: v14.x changed `getProducts()` API signature

### API Change Details

**v13.x and earlier**:
```typescript
getProducts({ skus: string[] }): Promise<Product[]>
```

**v14.x**:
```typescript
getProducts(productIds: string[]): Promise<Product[]>
```

---

## Files Modified Across All Builds

### Build 94
- `src/services/payment/AppleIAPService.ts` - Added `isInitialized` flag
- `app.json` - Build 94
- `ios/ReadingDailyScriptureApp/Info.plist` - Build 94
- `ios/ReadingDailyScriptureApp.xcodeproj/project.pbxproj` - Build 94

### Build 95
- `src/services/payment/AppleIAPService.ts` - Auto-init with try-catch
- `app.json` - Build 95
- iOS native files - Build 95

### Build 96
- `src/stores/useTrialStore.ts` - Removed blocking null checks in:
  - `purchaseLifetimeAccess()` (lines 230-253)
  - `restorePurchase()` (lines 274-294)
  - `upgradeToBasic()` (lines 323-343)
- `app.json` - Build 96
- iOS native files - Build 96

### Build 97 (THE FIX)
- `src/services/payment/AppleIAPService.ts:479` - **ONE LINE CHANGE**
  - From: `RNIap.getProducts({ skus: PRODUCT_IDS })`
  - To: `RNIap.getProducts(PRODUCT_IDS)`
- `app.json` - Build 97
- iOS native files - Build 97

### Build 98
- `app.json` - Build 98
- iOS native files - Build 98

---

## Testing Status

### Builds on TestFlight
- ✅ Build 94: Submitted, processed
- ✅ Build 95: Submitted, processed
- ✅ Build 96: Submitted, processed
- ✅ Build 97: Submitted, processed (PRIMARY FIX)
- ⏳ Build 98: Built, not yet submitted

### Expected Console.app Output (Build 97+)

**Success Flow**:
```
[AppleIAPService] Initializing...
[AppleIAPService] Connection initialized
[AppleIAPService] Loading products: ["com.readingdaily.lifetime.access.v2", ...]
[AppleIAPService] Products loaded: 3
✅ [AppleIAPService] Initialized successfully
💳 Processing purchase via apple
[AppleIAPService] Processing purchase: com.readingdaily.lifetime.access.v2
[AppleIAPService] Purchasing subscription: com.readingdaily.lifetime.access.v2
✅ Purchase successful: [transaction-id]
```

**Auto-Init Flow** (if needed):
```
⚠️ Payment service not initialized, creating now...
[AppleIAPService] Initializing...
[AppleIAPService] Loading products: [...]
✅ [AppleIAPService] Products loaded: 3
✅ [AppleIAPService] Initialized successfully
💳 Processing purchase via apple
```

---

## Lessons Learned

1. **Layer-by-layer debugging**: Issue had 3 layers:
   - Layer 1: AppleIAPService initialization tracking (Build 94)
   - Layer 2: Auto-initialization logic (Build 95)
   - Layer 3: Store-level blocking (Build 96)
   - Layer 4: Wrong API syntax (Build 97) ← **Root cause**

2. **API version compatibility**: Always check library changelog when upgrading major versions

3. **Error propagation**: Generic errors ("Payment service not initialized") can hide root causes

4. **Multi-point validation**: Initialization needs checks at multiple layers:
   - Connection established?
   - Products loaded?
   - Listeners registered?
   - Flag set correctly?

---

## Next Steps

### Immediate (Post-Build 97/98 Testing)
1. Test on TestFlight to confirm purchases work
2. Monitor Console.app for actual product loading
3. Verify all 3 product types load correctly

### If Still Failing
1. Check App Store Connect product configuration
2. Verify product IDs match exactly
3. Check bundle identifier matches App Store Connect
4. Verify StoreKit entitlement is enabled
5. Check Apple developer agreement status

### Future Improvements
1. Add better error messages with specific failure reasons
2. Add product loading retry logic
3. Add telemetry for initialization failures
4. Consider updating to react-native-iap 14.7.8

---

## References

- **react-native-iap Changelog**: Breaking changes in v14.x
- **Apple StoreKit**: Product loading requirements
- **Build URLs**:
  - Build 94: 18cd542d-7e66-4765-a73e-a17678002837
  - Build 95: 282d2559-46ff-4e41-9d41-ba0af42d5f1d
  - Build 96: 05fa7950-9d30-40ca-89d9-20e92bc93343
  - Build 97: a96de8d1-e900-4b26-90cf-a0f6435e0b38
  - Build 98: b1b720a2-e83c-4747-9782-db9a0e6f8a3d
