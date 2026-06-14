# GitHub Storage Setup Guide

Your tasks are now saved directly to your GitHub repository!

## 5-Minute Setup

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `daily-sticky-board`
3. Description: "Daily task planner with GitHub storage"
4. Choose **Public** (so tasks load from anywhere)
5. Check "Add a README file"
6. Click "Create repository"

### Step 2: Create Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `daily-sticky-board-token`
4. Expiration: **90 days** (or No expiration)
5. Scopes: Check only `repo` (full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN** (you won't see it again!)

### Step 3: Add Your Config

1. Open `github-storage.js` in your project
2. Find this section at the top:

```javascript
const GITHUB_CONFIG = {
  owner: "your-github-username",
  repo: "daily-sticky-board",
  token: "ghp_xxxxxxxxxxxxxxxxxxxxxxx",
  branch: "main"
};
```

3. Replace:
   - `your-github-username` → Your GitHub username (e.g., `john-doe`)
   - `ghp_xxxxxxx...` → Paste your token from Step 2
4. Save the file

### Step 4: Create Tasks Folder (Optional)

On GitHub, your repository will auto-create a `tasks/` folder when you save your first task, so no manual setup needed!

### Step 5: Test It

1. Open `index.html`
2. Add a task: "GitHub sync test" 
3. Go to your GitHub repo on the web
4. Look in the `tasks/` folder
5. See your task saved as a JSON file! ✓

## How It Works

```
Your Browser
    ↓
Add/Edit Task
    ↓
app.js saves to GitHub via API
    ↓
GitHub Repository
    ↓
Open on another browser/device
    ↓
Load tasks from GitHub
    ↓
Real-time sync!
```

## Files Saved in GitHub

Your repo structure will look like:

```
your-repo/
├── README.md
├── github-storage.js
├── preferences.json          (your view & date settings)
└── tasks/
    ├── 2026-06-13.json      (Monday tasks)
    ├── 2026-06-14.json      (Tuesday tasks)
    ├── 2026-06-15.json      (Wednesday tasks)
    └── ...
```

## Testing Cross-Device Sync

1. **Device A (Laptop):**
   - Open app, add task "Meeting at 2pm"
   - Check GitHub repo → see file created ✓

2. **Device B (Phone):**
   - Open same app
   - Refresh page
   - See "Meeting at 2pm" appear ✓

3. **Edit on Device B:**
   - Complete the task
   - Check GitHub → file updated ✓

4. **Back to Device A:**
   - Refresh page
   - See task marked complete ✓

## Troubleshooting

### "Error saving to GitHub"
- Check your token is correct
- Check token expiration date
- Check `repo` scope is enabled
- Check your GitHub username spelling

### "Tasks not appearing in repo"
- Make sure `token` in `github-storage.js` is not placeholder text
- Check you have internet connection
- Check GitHub is not down (github.com/status)
- Refresh page after saving

### "Can't load tasks from another device"
- Make sure repository is **Public** (not Private)
- Check `owner` and `repo` match your actual GitHub details
- Wait 5 seconds after saving (API takes a moment)
- Try refreshing browser

### "Token not working"
- Go to [github.com/settings/tokens](https://github.com/settings/tokens)
- Check token is active (shows a green dot)
- Check token hasn't expired
- Regenerate a new token if needed

## Security Notes

⚠️ **Keep your token private!**
- Don't share it online
- Don't commit it to version control
- Don't share your `github-storage.js` with token

If your token leaks:
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Delete the exposed token
3. Generate a new one
4. Update `github-storage.js`

## Advantages

✅ Free (GitHub is free)  
✅ No special setup needed (just a token)  
✅ Tasks visible in GitHub repo  
✅ Version history automatically  
✅ Works from anywhere  
✅ Private repository support  
✅ No backend server needed  
✅ Fully integrated with Git workflow  

## Limitations

⚠️ API rate limits (60 requests/hour unauthenticated, 5000/hour with token)  
⚠️ No real-time push notifications (must refresh to see changes)  
⚠️ Requires internet to sync  
⚠️ Token in browser code (use environment variables in production)  

## Advanced: Use Environment Variables

For production, never hardcode tokens. Instead:

1. Use a build tool (Vite, Webpack)
2. Store token in `.env` file
3. Load at build time
4. Deploy with token injected

Example with Vite:
```javascript
const token = import.meta.env.VITE_GITHUB_TOKEN;
```

## Next Steps

✅ Token created → `github-storage.js` updated → Test in browser

That's it! Your tasks now save to GitHub automatically.

---

**Need help?** Check the browser console (F12) for error messages. They'll tell you exactly what's wrong.
