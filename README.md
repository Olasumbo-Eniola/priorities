# Priorities

A focused task dashboard built with Next.js and Firebase. Tasks, checklist items, comments, priority placement, and daily reviews are stored per user in Cloud Firestore. Attachments remain local to the current browser session.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the public Firebase web configuration.
2. Install dependencies with `pnpm install`.
3. Start the app with `pnpm dev`.
4. Open [http://localhost:3000](http://localhost:3000).

The Firebase project must have Google Authentication enabled and a Firestore database created in production mode.

## Frontend structure

- `app/components/ui` contains reusable buttons, selects, icons, and modal behavior.
- `app/components/tasks` contains task cards, lists, drawers, and drawer sections.
- `app/components/reviews` contains the daily review flow.
- `app/styles/tokens.css` is the source of truth for interface colors.
- `app/dashboard.tsx` coordinates authenticated state and Firebase persistence.

## Firebase rules

The repository includes owner-scoped Firestore rules and indexes. After authenticating the Firebase CLI with the Google account that owns the project, deploy them with:

```bash
pnpm exec firebase deploy --only firestore
```

Run the rules tests with:

```bash
pnpm test:rules
```

The Firestore emulator used by the rules tests requires Java.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build --webpack
```
