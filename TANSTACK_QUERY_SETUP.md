# Stockflow App - TanStack Query + MMKV Setup Guide

## Overview

Modern data fetching and caching system using:
- **TanStack Query (React Query)** - Advanced data synchronization
- **MMKV** - Ultra-fast persistent cache storage
- **Automatic Invalidation** - Smart cache invalidation on mutations
- **Persistent Cache** - Data persists across app restarts (except auth token)

## Installation

```bash
npm install @tanstack/react-query
npm install expo-secure-store react-native-mmkv
```

## Architecture

```
TanStack Query (Client-side state)
├── Query Cache (in-memory + MMKV backup)
├── Mutation Handlers
└── Automatic Invalidation

MMKV Storage (Persistent)
├── User Profile (instant UI load)
├── Query Cache (survives app restart)
└── Token (SecureStore - encrypted)

API Layer
└── Axios with interceptors
```

## How It Works

### 1. Data Fetching with Auto-Caching

```javascript
import { useQueryData } from '../hooks/useQueryData';

export const CustomersScreen = () => {
  const { data, isLoading, error, isCached, refetch } = useQueryData('customers');

  if (isLoading && !isCached) return <LoadingSpinner />;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <CustomerCard item={item} />}
      onRefresh={refetch}
      refreshing={isLoading}
      ListHeaderComponent={() => isCached && <Text>Cached Data</Text>}
    />
  );
};
```

### 2. Creating Items (Auto-Invalidates List)

```javascript
import { useMutateData } from '../hooks/useMutateData';

export const CreateCustomerScreen = ({ navigation }) => {
  const { mutate: create, isPending, error } = useMutateData('customers', 'create');

  const handleCreate = async (formData) => {
    create(formData, {
      onSuccess: () => {
        // List will auto-refetch due to invalidation
        navigation.goBack();
      },
    });
  };

  return <CreateForm onSubmit={handleCreate} loading={isPending} error={error} />;
};
```

### 3. Updating Items (Auto-Invalidates List)

```javascript
export const EditCustomerScreen = ({ route, navigation }) => {
  const { update, isPending, error } = useMutateData('customers', 'update');
  const { customer } = route.params;

  const handleUpdate = (formData) => {
    update(
      { id: customer.id, data: formData },
      {
        onSuccess: () => {
          // List will auto-refetch
          navigation.goBack();
        },
      }
    );
  };

  return <EditForm initialData={customer} onSubmit={handleUpdate} loading={isPending} />;
};
```

### 4. Deleting Items (Auto-Invalidates List)

```javascript
export const CustomerDetailScreen = ({ route, navigation }) => {
  const { remove, isPending } = useMutateData('customers', 'delete');
  const { customer } = route.params;

  const handleDelete = () => {
    remove(customer.id, {
      onSuccess: () => {
        // List will auto-refetch
        navigation.navigate('Customers');
      },
    });
  };

  return <Button onPress={handleDelete} loading={isPending}>Delete</Button>;
};
```

## Cache Flow

### First Load
```
Component mounts
    ↓
useQueryData('customers') called
    ↓
Check TanStack Query cache (empty)
    ↓
Fetch from server
    ↓
Store in TanStack Query cache
    ↓
Persist to MMKV
    ↓
Render data
```

### App Restart (No White Screen)
```
App launches
    ↓
checkAuthStatus() loads profile from MMKV (instant)
    ↓
Dashboard screen mounts
    ↓
useQueryData('customers') called
    ↓
Check TanStack Query cache (restored from MMKV)
    ↓
Return cached data instantly
    ↓
Background: Fetch fresh data from server
    ↓
Update cache if different
    ↓
UI updates if needed
```

### After Mutation
```
User creates/updates/deletes item
    ↓
useMutateData sends request
    ↓
Server confirms (200)
    ↓
onSuccess callback triggers
    ↓
invalidateQuery(['customers'])
    ↓
TanStack Query marks query as stale
    ↓
Any component using useQueryData('customers') refetches
    ↓
New list data loaded
    ↓
MMKV cache updated
    ↓
UI reflects latest data
```

## Configuration

### Cache Duration

Edit `stockflowapp/src/services/queryClient.js`:

```javascript
defaultOptions: {
  queries: {
    staleTime: 10 * 60 * 1000,      // Data fresh for 10 min
    gcTime: 30 * 60 * 1000,         // Keep in memory 30 min
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
}
```

### Endpoints Supported

Default endpoints cached by TanStack Query:
- customers
- suppliers
- products
- staff
- warehouses
- categories
- purchase_orders
- sales_orders

Add more by using `useQueryData(endpoint)` for any endpoint.

## File Structure

```
stockflowapp/src/
├── services/
│   └── queryClient.js          # TanStack Query + MMKV config
├── hooks/
│   ├── useQueryData.js         # Data fetching with cache
│   └── useMutateData.js        # Create/Update/Delete with invalidation
├── utils/
│   └── storage.js              # TokenStorage, UserProfileStorage
├── contexts/
│   ├── AuthContext.js          # Updated for clearAuthStorage
│   └── ApiContext.js           # Updated for clearAuthStorage
└── screens/
    └── (Your screens using hooks)
```

## Usage Patterns

### Pattern 1: Simple List Display

```javascript
const { data, isLoading } = useQueryData('customers');

return (
  <FlatList
    data={data}
    renderItem={({ item }) => <Item item={item} />}
  />
);
```

### Pattern 2: With Refresh

```javascript
const { data, isLoading, refetch } = useQueryData('customers');

return (
  <FlatList
    data={data}
    onRefresh={refetch}
    refreshing={isLoading}
  />
);
```

### Pattern 3: With Cached Data Display

```javascript
const { data, isLoading, isCached } = useQueryData('customers');

return (
  <>
    {isCached && <Text>Cached Data</Text>}
    <FlatList data={data} />
  </>
);
```

### Pattern 4: Create with Success Handling

```javascript
const { mutate: create, isPending } = useMutateData('customers', 'create');

const handleCreate = () => {
  create(formData, {
    onSuccess: (newCustomer) => {
      console.log('Created:', newCustomer);
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });
};
```

## How Invalidation Works

**Step 1: User Creates Item**
```javascript
create(formData) // mutate('customers', 'create', formData)
```

**Step 2: Server Confirms**
```
POST /api/customers → 200 OK
```

**Step 3: TanStack Query Invalidates**
```javascript
// In useMutateData onSuccess
invalidateQuery([endpoint]) // Marks 'customers' query as stale
```

**Step 4: Auto-Refetch**
```
Any component using useQueryData('customers'):
├── Detects query is stale
├── Automatically refetches
└── Updates UI with new data
```

**Result:** List automatically refreshes without manual refetch!

## Cache Persistence

### What Gets Cached (Survives App Restart)
✅ All query data (customers, products, etc.)
✅ User profile
✅ Cache metadata and timestamps

### What Gets Cleared (On Logout)
❌ JWT token (from SecureStore)
❌ User profile (from MMKV)
❌ **Query cache PERSISTS** (user can see old data)

### Why Keep Query Cache on Logout?

- Users can see their previous data when re-logging in
- Faster subsequent logins
- Works offline if data is cached
- Can clear manually if needed

### Manual Cache Clear (if needed)

```javascript
import { clearAllQueryCache } from '../services/queryClient';

// Clear all query cache
clearAllQueryCache();
```

## Debugging

### View Query Cache

```javascript
import { queryClient } from '../services/queryClient';

// View all cached queries
console.log(queryClient.getQueryData(['customers']));

// View all queries
console.log(queryClient.getQueryCache().getAll());
```

### View MMKV Cache

```javascript
import { mmkvStorage } from '../utils/storage';

// View all keys
const keys = mmkvStorage.getAllKeys();
console.log('All MMKV keys:', keys);

// View specific cached query
const cached = mmkvStorage.getString('query_["customers"]');
console.log('Customers cache:', JSON.parse(cached));
```

### Enable Logging

```javascript
// In queryClient.js queryCache
onSuccess: (data, query) => {
  console.log(`✅ Query success: ${JSON.stringify(query.queryKey)}`);
  // ... persist to MMKV
},
onError: (error, query) => {
  console.error(`❌ Query error: ${JSON.stringify(query.queryKey)}`, error.message);
},
```

## Performance Tips

1. **Use Stale Time Appropriately**
   - Short lived data: 1-2 minutes
   - Normal data: 5-10 minutes
   - Static data: 30+ minutes

2. **Disable Auto-Refetch When Not Needed**
   ```javascript
   useQueryData('customers', {
     refetchOnWindowFocus: false,
     refetchOnReconnect: false,
   })
   ```

3. **Use Pagination for Large Lists**
   ```javascript
   useQueryData(['customers', { page: 1 }])
   ```

4. **Monitor Cache Size**
   ```javascript
   // Implement periodic cleanup for very large apps
   ```

## Troubleshooting

### Issue: List not updating after create

**Solution:** Ensure useMutateData is used and invalidation is happening.

```javascript
// ❌ Wrong - using api.post directly
await api.post('/api/customers', data);

// ✅ Correct - using useMutateData
const { mutate } = useMutateData('customers', 'create');
mutate(data);
```

### Issue: Stale data showing

**Solution:** Reduce staleTime in queryClient.js:

```javascript
staleTime: 5 * 60 * 1000, // 5 minutes instead of 10
```

### Issue: Cache not persisting

**Solution:** Check that query is successful and MMKV is writable.

```javascript
// Verify MMKV is working
import { mmkvStorage } from '../utils/storage';
mmkvStorage.set('test', 'value');
console.log(mmkvStorage.getString('test'));
```

### Issue: Token not in requests

**Solution:** Verify ApiContext request interceptor:

```javascript
const token = await TokenStorage.get();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

## Testing Checklist

- [ ] Install TanStack Query and MMKV
- [ ] Implement QueryClient
- [ ] Create useQueryData hook
- [ ] Create useMutateData hook
- [ ] Test list loading
- [ ] Test cached data on restart
- [ ] Test create with invalidation
- [ ] Test update with invalidation
- [ ] Test delete with invalidation
- [ ] Test logout keeps cache
- [ ] Test background sync
- [ ] Monitor performance

## Best Practices

1. **Always use hooks** - Don't use api.get/post directly
2. **Handle errors gracefully** - Show error messages
3. **Show loading states** - But use cached data if available
4. **Batch mutations** - If multiple changes, batch them
5. **Monitor cache** - Check MMKV usage occasionally
6. **Test offline** - Verify cached data works
7. **Set appropriate stale times** - Balance freshness vs performance

## Next Steps

1. Install dependencies
2. Setup QueryClient with MMKV
3. Create useQueryData and useMutateData hooks
4. Update screens to use new hooks
5. Test invalidation flow
6. Monitor performance and adjust cache duration
