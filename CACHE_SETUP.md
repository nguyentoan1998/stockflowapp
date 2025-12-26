# Stockflow App - Cache & Storage Setup Guide

## Overview

Comprehensive caching and storage system for optimal performance and offline support:
- **SecureStore**: Encrypted JWT tokens
- **MMKV**: User profile (instant loading)
- **Redux Persist + MMKV**: Screen data caching
- **Background sync**: Automatic data updates

## Installation

Install required dependencies:

```bash
npm install expo-secure-store react-native-mmkv
npm install @reduxjs/toolkit react-redux redux-persist
```

## Architecture

### 1. Storage Layers

```
SecureStore (Encrypted)
└── JWT Token

MMKV (Fast Key-Value)
├── User Profile (instant UI load)
├── Cache Metadata
└── Redux Persist Data

Redux Store
└── Data Slices (with persist)
```

### 2. App Startup Flow

```
App Launch
    ↓
checkAuthStatus()
    ├─ Check token in SecureStore
    ├─ Load profile from MMKV (INSTANT UI)
    ├─ Background: Fetch /auth/me for updates
    └─ Navigate to Dashboard / Login
```

### 3. Data Loading Flow

```
Screen Load
    ↓
useDataCache(endpoint)
    ├─ Check Redux store
    ├─ Check cache validity (10 min)
    ├─ Return cached data if valid
    ├─ If expired: Fetch from server
    ├─ Update Redux + MMKV
    └─ Return fresh data
```

## File Structure

```
stockflowapp/src/
├── redux/
│   ├── store.js                 # Redux store with MMKV persist
│   └── slices/
│       └── dataSlice.js         # Data reducer and actions
├── hooks/
│   ├── useDataCache.js          # Smart caching hook
│   └── useMutation.js           # Create/Update/Delete hook
├── utils/
│   └── storage.js               # TokenStorage, UserProfileStorage, CacheStorage
├── contexts/
│   ├── AuthContext.js           # Updated with storage utils
│   └── ApiContext.js            # Updated with TokenStorage
└── screens/
    └── LoginScreen.js           # Updated with email validation & remember me
```

## Usage Examples

### 1. Loading Data with Cache

```javascript
import { useDataCache } from '../hooks/useDataCache';
import { useApi } from '../contexts/ApiContext';

export const CustomersScreen = () => {
  const { api } = useApi();
  const { data, loading, refresh, isCacheValid } = useDataCache(
    'customers',
    api,
    { syncInterval: 5 * 60 * 1000 } // Sync every 5 minutes
  );

  if (loading && !data.length) {
    return <LoadingSpinner />;
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <CustomerCard item={item} />}
      refreshing={loading}
      onRefresh={refresh}
    />
  );
};
```

### 2. Creating/Updating Items

```javascript
import { useMutation } from '../hooks/useMutation';
import { useApi } from '../contexts/ApiContext';

export const CreateCustomerScreen = ({ navigation }) => {
  const { api } = useApi();
  const { create, loading, error } = useMutation('customers', api);

  const handleCreate = async (formData) => {
    const result = await create(formData);
    if (result.success) {
      navigation.goBack();
    }
  };

  return (
    <Form onSubmit={handleCreate} loading={loading} error={error} />
  );
};
```

### 3. Deleting Items

```javascript
import { useMutation } from '../hooks/useMutation';

export const CustomerDetailScreen = ({ route }) => {
  const { api } = useApi();
  const { remove, loading } = useMutation('customers', api);
  const { customer } = route.params;

  const handleDelete = async () => {
    const result = await remove(customer.id);
    if (result.success) {
      navigation.goBack();
    }
  };

  return (
    <Button onPress={handleDelete} loading={loading}>
      Delete
    </Button>
  );
};
```

## How It Works

### Token Management

```javascript
// Login
await login(email, password)
  // Token saved to SecureStore (encrypted)
  // User profile saved to MMKV
  // Navigate to Dashboard

// App Restart
await checkAuthStatus()
  // Load token from SecureStore
  // Load profile from MMKV (instant)
  // Background fetch for updates

// Logout
await logout()
  // Delete token from SecureStore
  // Delete profile from MMKV
  // Clear all cache from MMKV
```

### Data Caching

```javascript
// First load
const data = await useDataCache('customers', api)
  // Fetch from server
  // Store in Redux
  // Persist to MMKV
  // Return data

// Subsequent loads (within 10 min)
const data = await useDataCache('customers', api)
  // Check cache validity
  // Return from Redux (instant)
  // No server call

// After 10 minutes
const data = await useDataCache('customers', api)
  // Cache expired
  // Fetch from server
  // Update Redux + MMKV
  // Return new data

// Force refresh
const data = await useDataCache('customers', api, { forceRefresh: true })
  // Skip cache check
  // Fetch from server immediately
  // Update all stores
```

### Mutations

```javascript
// Create
const result = await create(formData)
  // POST /api/customers
  // Update Redux store
  // Cache updated automatically

// Update
const result = await update(id, formData)
  // PUT /api/customers/{id}
  // Update Redux store
  // Cache updated automatically

// Delete
const result = await remove(id)
  // DELETE /api/customers/{id}
  // Remove from Redux store
  // Cache updated automatically
```

## Cache Configuration

### Cache Duration

Edit `stockflowapp/src/hooks/useDataCache.js`:

```javascript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
```

### Sync Intervals

Pass options to `useDataCache`:

```javascript
useDataCache('customers', api, {
  forceRefresh: false,          // Force server fetch
  syncInterval: 5 * 60 * 1000   // Background sync every 5 min
})
```

### What Gets Cached

**Persisted in Redux (survives app restart):**
- customers
- suppliers
- products
- staff
- warehouses
- categories

**Not Persisted (cleared on logout):**
- All cache entries

## Performance Metrics

| Operation | Time | Source |
|-----------|------|--------|
| Load cached profile | ~5ms | MMKV |
| Load cached list | ~10ms | Redux |
| Fetch from server | ~200-500ms | Network |
| Check cache | ~1ms | In-memory |

## Offline Support

With this caching system:

✅ User profile loads instantly on app restart
✅ Screen lists load from cache immediately
✅ No network? Display cached data
✅ Background sync when network available
✅ Mutations queued until online (requires additional setup)

## Clearing Cache

### On Logout
```javascript
await logout()
// Automatically clears:
// - Token from SecureStore
// - Profile from MMKV
// - All cache from MMKV
// - Redux store
```

### Manual Clear
```javascript
import { CacheStorage, UserProfileStorage, TokenStorage } from '../utils/storage';

// Clear specific cache
CacheStorage.clear();

// Clear specific endpoint cache
CacheStorage.remove('customers');

// Clear profile
UserProfileStorage.remove();

// Clear token
await TokenStorage.remove();
```

## Debugging

### Check Storage Contents

```javascript
import { mmkvStorage } from '../utils/storage';

// View all keys
const keys = mmkvStorage.getAllKeys();
console.log('All MMKV keys:', keys);

// View specific item
const profile = mmkvStorage.getString('userProfile');
console.log('User profile:', profile);

// View cache
const cache = mmkvStorage.getString('persist_stockflow');
console.log('Redux cache:', cache);
```

### Enable Logging

Add to `ApiContext.js`:

```javascript
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API] Error: ${error.message}`);
    return Promise.reject(error);
  }
);
```

## Testing Checklist

- [ ] App loads, user sees Dashboard immediately (cached profile)
- [ ] Server sync updates profile in background
- [ ] Refresh button fetches fresh data
- [ ] New customer created updates list immediately
- [ ] Existing customer updated reflects in list
- [ ] Customer deleted removed from list
- [ ] Logout clears all cache
- [ ] App restart shows login screen if logged out
- [ ] App restart shows Dashboard if logged in
- [ ] Background sync works every 5 minutes
- [ ] Force refresh ignores cache

## Troubleshooting

### Issue: White screen on app restart

**Solution:** Ensure `checkAuthStatus()` is called in `useEffect` at app root level.

```javascript
useEffect(() => {
  checkAuthStatus();
}, []);
```

### Issue: Stale data showing

**Solution:** Reduce cache duration or enable background sync:

```javascript
useDataCache('customers', api, {
  syncInterval: 2 * 60 * 1000 // 2 minutes instead of 10
})
```

### Issue: Token not being sent

**Solution:** Check ApiContext request interceptor has TokenStorage.get():

```javascript
const token = await TokenStorage.get();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Issue: Changes not reflecting in list

**Solution:** Ensure mutation hooks are used and return to screen with `useFocusEffect`:

```javascript
useFocusEffect(
  useCallback(() => {
    refresh(); // Refresh data when screen focused
  }, [refresh])
);
```

## Best Practices

1. **Always use hooks**: `useDataCache` and `useMutation` for consistency
2. **Set appropriate sync intervals**: Balance between freshness and battery/data
3. **Handle loading states**: Show cached data while fetching
4. **Test offline**: Verify app works with cached data
5. **Monitor storage**: Check MMKV usage occasionally
6. **Clear old cache**: Implement periodic cleanup for large apps

## Next Steps

1. Install dependencies
2. Run app and verify instant profile loading
3. Test login/logout cycle
4. Implement screens using `useDataCache` and `useMutation`
5. Enable background sync as needed
6. Monitor performance and adjust cache duration
