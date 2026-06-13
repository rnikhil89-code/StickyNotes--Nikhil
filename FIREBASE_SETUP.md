# Firebase Setup Guide

To enable cloud-based task storage with real-time sync across devices, follow these steps:

## Step 1: Create a Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click **"Get Started"** and sign in with your Google account
3. Click **"Create a project"**
4. Enter project name (e.g., "Daily Sticky Board")
5. Disable Google Analytics (optional)
6. Click **"Create project"**

## Step 2: Enable Firestore Database

1. In Firebase Console, click **"Firestore Database"** in the left menu
2. Click **"Create Database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location (e.g., us-central1)
5. Click **"Create"**

## Step 3: Enable Anonymous Authentication

1. In Firebase Console, click **"Authentication"** in the left menu
2. Click **"Get Started"**
3. Click **"Anonymous"** provider
4. Toggle **"Enable"** to ON
5. Click **"Save"**

## Step 4: Get Your Firebase Config

1. In Firebase Console, click the **Settings icon** (gear) → **"Project Settings"**
2. Scroll to **"Your apps"** section
3. Click **"Web"** (or add if not present)
4. Copy the entire config object that looks like:

```javascript
{
  apiKey: "AIzaSyDOKKKxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
}
```

## Step 5: Update firebase-config.js

1. Open `firebase-config.js` in the daily-sticky-board folder
2. Replace the `FIREBASE_CONFIG` object with your config from Step 4
3. Save the file

## Step 6: Verify Everything Works

1. Refresh the browser page
2. You should see "Tasks saved to cloud repository" in the footer
3. Add a task on your device
4. Open the same page on another device/browser
5. Your tasks should appear in real-time!

## Security Note (For Production)

For production use, replace test mode with security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Features Now Enabled

✅ **Cloud Storage**: Tasks saved to Firebase Firestore  
✅ **Real-time Sync**: Changes appear instantly across devices  
✅ **Weekend Smart Logic**: Shows next week (Mon-Fri) when viewing on weekends  
✅ **Automatic Backup**: Cloud backup of all tasks  
✅ **Cross-Device Access**: Access your tasks from any device with internet

## Troubleshooting

- **"Tasks saved to browser" message**: Firebase config not properly set. Check firebase-config.js
- **401 Authentication Error**: Check that Anonymous auth is enabled in Firebase
- **"Cannot read property 'firestore' of undefined"**: Firebase scripts are loading. Refresh page.
