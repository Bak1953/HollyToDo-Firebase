# Holly's ToDo List — Firebase Sync Edition

A synced version of Holly's ToDo List that stores tasks in **Firebase Firestore** and provides **free calendar-based reminders**.

The original localStorage-only PWA remains in `HollyToDo`; this folder is a separate Firebase-enabled build.

## Features

- Real-time sync across devices (iPhone, iPad, Mac, Android, desktop)
- Anonymous sign-in so it works immediately
- Offline persistence: continue using the app briefly without a connection; changes resync automatically
- Reminders by calendar export: download an `.ics` file of active tasks with due dates and import into Apple/Google/Outlook Calendar
- Same categories, priorities, printing, and PWA shell as the original

## What this version does NOT include

- **Push notifications** are not enabled because they require Firebase Cloud Functions, which needs a paid (Blaze) billing plan.
- The calendar export is the free alternative: it creates calendar events with a reminder one day before each due date.

## Firebase setup

1. Go to https://console.firebase.google.com and create a project.
2. Enable **Firestore Database** and **Authentication**.
3. In Authentication → Sign-in method, enable **Anonymous**.
4. Register a **Web app** in Project settings → Your apps.
5. Copy the Firebase config object and paste it into `firebase-config.js`, replacing the placeholder values.
6. Add your GitHub Pages URL to Firebase Console → **Authentication → Settings → Authorized domains**.
   - Example: `bak1953.github.io` (not the full path)
   - Also add `localhost` if you want to test locally.

## Deploy the web app on GitHub Pages (free)

1. Push this folder to the `main` branch of `Bak1953/HollyToDo-Firebase`.
2. On GitHub, go to **Settings → Pages** and set the source to the `main` branch.
3. Wait a minute, then visit `https://bak1953.github.io/HollyToDo-Firebase/`.
4. Make sure `bak1953.github.io` is added as an authorized domain in Firebase Authentication.

## Firestore security rules

Deploy the rules so each user can only read and write their own tasks:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

If you do not have the Firebase CLI installed, you can paste the contents of `firestore.rules` directly into the Firestore rules editor in the Firebase console.

## Calendar reminders

1. In the app, tap **Export to Calendar**.
2. Open the downloaded `.ics` file on your device.
3. Choose the calendar you want to import into (Apple Calendar, Google Calendar, Outlook, etc.).
4. Each task becomes an all-day event with a reminder one day before the due date. The calendar then syncs the reminder to all your devices.

## Optional: Firebase Hosting

If you later want a custom domain:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Optional: push reminders (paid Cloud Functions)

If you later decide to enable billing, the `functions/` folder contains a scheduled Cloud Function that sends FCM push notifications at 08:00 each day for tasks due the next day. Deploy with:

```bash
cd functions
npm install
firebase deploy --only functions,firestore:rules,firestore:indexes
```

## Local development

Serve the folder with any static server, for example:

```bash
npx serve .
```

Open the printed URL in a browser. Because this app uses Firebase Auth, running directly from `file://` will not work.

## Notes

- The `service-worker.js` caches the app shell but does **not** cache Firestore data or the Firebase SDK network calls.
- Firestore offline persistence is enabled, so the app continues to work briefly when the connection is lost and resyncs automatically.
