# Daily Sticky Board

A lightweight sticky-notes planner with:

- One task-note board per day
- Three views: Day, Week (Monday to Friday), and Month
- Real-time updates inside the page and across open browser tabs
- Voice input for adding tasks (browser support required)
- Auto-save in browser localStorage

## Run locally

Open `index.html` in your browser.

## Use it

1. Pick a date.
2. Switch between **Day**, **Week (Mon-Fri)**, and **Month** views.
3. Add tasks for each day.
4. Use **Complete/Undo** to mark task status and **Delete** to remove tasks.
5. Use the **Voice** button to speak and add tasks hands-free.

## Important sync note

Current implementation stores tasks in browser localStorage. That means:

- You keep data on your machine/browser.
- Real-time sync works across tabs of the same browser.
- Different devices do **not** sync yet.

## Publish so you can access from anywhere

### Option A: GitHub Pages (easy)

1. Create a GitHub repository and upload this folder.
2. In repo settings, enable **Pages** from branch `main` and folder `/root`.
3. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### Option B: Azure Static Web Apps

1. Push this folder to GitHub.
2. In Azure, create a Static Web App linked to that repo.
3. Azure builds and publishes automatically with a global URL and optional custom domain.

### Option C: Netlify or Vercel

1. Import the GitHub repo.
2. Framework preset: **None** (static site).
3. Publish directory: `/`.

## How to make cross-device real-time sync

Use a backend datastore with realtime events, for example:

- Firebase Firestore
- Supabase Postgres + Realtime
- Azure Cosmos DB + SignalR layer

Then replace localStorage calls with cloud reads/writes and subscribe to live updates.
