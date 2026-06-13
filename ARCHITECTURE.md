# Daily Sticky Board - Implementation Guide

## Current Status

Your sticky-notes application now has:
- ✅ Professional UI with modern design
- ✅ Day, Week (default), and Month views
- ✅ Voice input for tasks
- ✅ Weekend-smart logic (shows next Monday when on weekend)
- ✅ Cloud repository support (Firebase - setup required)

## Current Architecture (Works Now)

```
browser
  ├── index.html
  ├── styles.css
  ├── app.js (stores in localStorage)
  └── tasks persist in browser
```

## To Enable Cloud Repository

### Step 1: Add Firebase to index.html

In the `<head>` section, the Firebase SDK is already added:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"></script>
```

### Step 2: Configure Firebase

Follow `FIREBASE_SETUP.md` to:
1. Create a Firebase project
2. Get your configuration
3. Update `firebase-config.js`

### Step 3: Update HTML Script Tags

Add this to `index.html` after the Firebase SDK scripts:
```html
<script src="firebase-config.js"></script>
```

Then update `app.js` init function to initialize Firebase first.

## How Weekend Logic Works

**Current Implementation:**
```javascript
function getDefaultDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If Saturday (6) or Sunday (0), get next Monday
  if (dayOfWeek === 0) {
    today.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 6) {
    today.setDate(today.getDate() + 2);
  }
  
  return getDateKey(today);
}
```

**What it does:**
- Sunday (0) → Add 1 day → Monday
- Saturday (6) → Add 2 days → Monday
- Mon-Fri → No change

**Result:** On weekends, weekly view shows next Monday-Friday automatically

## Task Storage Options

### Option A: Browser Storage (Current - No Setup)
```
Tasks → localStorage → Browser memory
↑        (persists across refreshes)
└── Only on same browser/device
```

### Option B: Firebase Cloud (Recommended)
```
Tasks → Firebase SDK → Firestore Cloud Database
↑                     (real-time)
└── Synced across all devices/browsers
```

## Firebase Data Structure

When Firebase is set up, tasks are stored as:

```
firestore
└── users
    └── {userId}
        ├── preferences
        │   ├── view: "week"
        │   ├── selectedDate: "2026-06-13"
        │   └── updatedAt: timestamp
        │
        └── tasks
            ├── 2026-06-13
            │   ├── tasks: [...]
            │   └── updatedAt: timestamp
            ├── 2026-06-14
            │   ├── tasks: [...]
            │   └── updatedAt: timestamp
            └── ...
```

## Integration Steps for Developers

1. **Copy firebase-config.js** to your project
2. **Add Firebase SDK** to HTML (done)
3. **Update init() function** in app.js:
```javascript
async function init() {
  // ... existing code ...
  
  if (typeof initializeFirebase !== 'undefined') {
    firebaseReady = await initializeFirebase();
  }
  
  // ... rest of init ...
}
```

4. **Update persistence functions**:
```javascript
async function persistAndRender() {
  if (firebaseReady) {
    await saveUserPreferences(state.view, state.selectedDate);
  }
  render();
}
```

5. **Update task saving**:
```javascript
async function saveTasks(dateKey, tasks) {
  if (firebaseReady) {
    await saveTasksToFirestore(dateKey, tasks);
  }
  persistAndRender();
}
```

## Testing Checklist

**Without Firebase:**
- [ ] Open app in browser
- [ ] Add task on Monday
- [ ] Add task on weekend (verify it shows next Monday)
- [ ] Refresh page (tasks persist)
- [ ] Open in private/incognito (data isolated)

**With Firebase (After Setup):**
- [ ] Open app in browser
- [ ] Add task
- [ ] Open same app in another browser/device
- [ ] Task appears in real-time
- [ ] Complete task on device A
- [ ] Status updates on device B automatically

## Deployment Options

### Option 1: GitHub Pages (Free)
- No backend server needed
- Tasks stored in Firebase (if set up)
- Steps:
  1. Push to GitHub
  2. Enable Pages in repo settings
  3. Get public URL

### Option 2: Netlify (Free)
- Deploy from GitHub
- Good for simple apps
- Tasks synced via Firebase

### Option 3: Azure Static Web Apps (Free with Microsoft Account)
- Native Azure integration
- Tasks synced via Firebase
- Custom domain support

### Option 4: Self-hosted Server
- Full control
- Can implement custom backend
- Firebase optional

## Fallback Behavior

If Firebase config is invalid or unavailable:
- App still works with localStorage
- Tasks persist in browser
- No cloud sync
- Graceful degradation

## Troubleshooting

**"Scripts not found" error:**
- Check Firebase SDKs are loaded
- Check firebase-config.js path
- Open browser console (F12) for details

**"Cannot read property 'firestore' of undefined":**
- Firebase SDK not loaded yet
- Wait for page to fully load
- Check script order in HTML

**Data not syncing:**
- Firebase config missing or invalid
- Anonymous auth not enabled
- Firestore rules too restrictive
- Check Firebase Console logs

**Weekend view not working:**
- JavaScript Date object issue
- Check browser time is correct
- Verify getDefaultDate() is called

## Performance Notes

- App loads instantly (no server needed)
- Firebase queries are fast (~100-300ms)
- Real-time sync is near-instant
- Works offline if Firebase is cached
- LocalStorage fallback is instant

## Next Version Ideas

- User authentication (vs anonymous)
- Task sharing with others
- Recurring tasks
- Task tags/categories
- Mobile app (React Native)
- Dark mode
- Drag-and-drop reordering
- Task priorities

---

**Documentation Version:** 2.0  
**Last Updated:** 2026-06-13  
**Compatible with:** All modern browsers
