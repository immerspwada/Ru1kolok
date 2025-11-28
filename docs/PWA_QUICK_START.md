# PWA Quick Start Guide

## For Developers

### Using Offline Data Caching

```typescript
import { useOfflineData, STORES } from '@/hooks/useOfflineData';

// In your component
const { data, isLoading, isOffline, error, refetch } = useOfflineData({
  storeName: STORES.TRAINING_SESSIONS,
  fetchFn: async () => {
    const response = await fetch('/api/sessions');
    return response.json();
  },
  maxAge: 6 * 60 * 60 * 1000, // 6 hours
});

// Use the data
if (isOffline) {
  // Show offline indicator
}
```

### Making Offline-Aware API Calls

```typescript
import { offlinePost } from '@/lib/utils/offline-api';

// Automatically queues when offline
const result = await offlinePost(
  '/api/athlete/check-in',
  { sessionId, athleteId },
  'check-in' // resource type for sync
);

if (result.queued) {
  // Show message: "Saved offline, will sync when online"
}
```

### Managing Push Notifications

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

const { isSubscribed, subscribe, unsubscribe } = usePushNotifications(userId);

// Subscribe
await subscribe();

// Unsubscribe
await unsubscribe();
```

### Monitoring Sync Status

```typescript
import { useSync } from '@/hooks/useSync';

const { syncStatus, pendingCount, manualSync } = useSync();

// Check status
if (syncStatus.status === 'syncing') {
  console.log(`Syncing: ${syncStatus.progress}%`);
}

// Manual sync
await manualSync();
```

## For Users

### Installing the App

**On Mobile (Android/iOS):**
1. Open the website in Chrome/Safari
2. Look for "Install" or "Add to Home Screen" prompt
3. Tap "Install"
4. App icon appears on home screen

**On Desktop (Chrome/Edge):**
1. Open the website
2. Look for install icon in address bar
3. Click "Install"
4. App opens in its own window

### Using Offline

1. Open the app while online
2. Navigate to pages you want to use offline
3. Go offline (airplane mode, no WiFi)
4. Continue using cached pages
5. Perform actions (they'll sync when back online)

### Enabling Push Notifications

1. Go to Settings or Profile
2. Find "Push Notifications" section
3. Toggle on
4. Grant permission when prompted
5. You'll now receive real-time notifications

## Troubleshooting

### App Won't Install
- Make sure you're using HTTPS
- Try a different browser (Chrome/Edge recommended)
- Clear browser cache and try again

### Offline Mode Not Working
- Visit pages while online first (to cache them)
- Check browser storage isn't full
- Try clearing cache and reloading

### Push Notifications Not Working
- Check notification permission is granted
- Verify you're using a supported browser
- Try unsubscribing and subscribing again

### Sync Not Happening
- Check you're back online
- Look for sync status indicator
- Try manual sync button
- Check browser console for errors

## Best Practices

### For Developers

1. **Always use offline-aware APIs** for mutations
2. **Cache critical data** that users need offline
3. **Show offline indicators** when appropriate
4. **Handle sync failures** gracefully
5. **Test offline scenarios** thoroughly

### For Users

1. **Install the app** for best experience
2. **Enable push notifications** to stay updated
3. **Visit pages while online** to cache them
4. **Wait for sync** before closing app when back online
5. **Check sync status** if actions seem delayed

## Configuration

### Environment Variables

```env
# Required for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Support

For issues or questions:
1. Check browser console for errors
2. Review documentation in `/docs/PWA_FEATURES.md`
3. Contact development team
