# Holly's ToDo List — Firebase Sync Edition

A synced version of Holly's ToDo List that stores tasks in **Firebase Firestore** and can send **due-date reminders** via Firebase Cloud Messaging.

The original localStorage-only PWA remains in `HollyToDo`; this folder is a separate Firebase-enabled build.

## Features

- Real-time sync across devices (iPhone, iPad, Mac, Android, desktop)
- Anonymous sign-in so it works immediately
- Optional push notification reminders one day before a task is due (requires Cloud Functions)
- Free calendar export fallback: download an `.ics` file of active tasks with due dates and import into Apple/Google/Outlook Calendar
- Same categories, priorities, printing, and offline-first PWA shell as the original

## Firebase setup

1. Go to https://console.firebase.google.com and create a project.
2. Enable **Firestore Database** and **Authentication**.
3. In Authentication → Sign-in method, enable **Anonymous**.
4. Register a **Web app** in Project settings → Your apps.
5. Copy the Firebase config object and paste it into `firebase-config.js`, replacing the placeholder values.
6. In Project settings → **Cloud Messaging**, copy the **Web Push certificate (VAPID key)** and replace the placeholder in `script.js` if it is not already filled in.
7. Add your GitHub Pages URL to Firebase Console → **Authentication → Settings → Authorized domains**.
   - Example: `bak1953.github.io` (not the full path)
   - Also add `localhost` if you want to test locally.

## Deploy the web app

The front end can be hosted for free on **GitHub Pages**.

### GitHub Pages

1. Push this folder to the `main` branch of `Bak1953/HollyToDo-Firebase`.
2. On GitHub, go to **Settings → Pages** and set the source to the `main` branch.
3. Wait a minute, then visit `https://bak1953.github.io/HollyToDo-Firebase/`.
4. Make sure `bak1953.github.io` is added as an authorized domain in Firebase Authentication.

### Firebase Hosting (optional, paid for custom domain)

If you later want a custom domain or tighter Firebase integration:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Cloud Functions / push reminders

The `functions/` folder contains a scheduled Cloud Function that sends an FCM notification at 08:00 each day for tasks due the next day.

Cloud Functions require the **Blaze** plan (pay-as-you-go). For a personal ToDo app the usage is usually within Firebase’s free tier, but a billing card is required.

1. In the `functions` folder, install dependencies:
   ```bash
   cd functions
   npm install
   ```
2. Deploy the function and Firestore rules:
   ```bash
   firebase deploy --only functions,firestore:rules,firestore:indexes
   ```

## Calendar export (free reminder fallback)

If you do not want to enable billing for Cloud Functions, use the **Export to Calendar** button in the app. It downloads an `.ics` file of all active tasks that have a due date. Import the file into Apple Calendar, Google Calendar, or Outlook; each event has a reminder one day before the due date, and calendars sync across all your devices.

## Local development

Serve the folder with any static server, for example:

```bash
npx serve .
```

Open the printed URL in a browser. Because this app uses Firebase Auth, running directly from `file://` will not work.

## Notes

- `firebase-messaging-sw.js` is registered explicitly so FCM works when the app is hosted in a subpath such as `https://bak1953.github.io/HollyToDo-Firebase/`.
- The `service-worker.js` caches the app shell but does **not** cache Firestore data or the Firebase SDK network calls.
- Firestore offline persistence is enabled, so the app continues to work briefly when the connection is lost and resyncs automatically.
