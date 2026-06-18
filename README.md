# learningtolearn — Flashcards

An interactive flashcard deck on the science of durable learning — retrieval
practice, spacing, interleaving, deliberate practice, and calibration. Ten
cards, a 3D flip, keyboard navigation, and a faint forgetting-curve motif on a
dark forest-green canvas.

Ported from a self-contained HTML prototype into a standalone Next.js app that
mirrors the stack of the [Hearth](https://hearth.tnmlabs.com) project
(Next.js 15 · React 19 · TypeScript · Tailwind 3 · deployed on Vercel).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Interactions

- Click the card, press the **Flip** button, or press **Space**/**Enter** while
  the card is focused to flip it.
- **←** / **→** arrow keys, the prev/next buttons, or the dots navigate between
  cards (moving cards always returns to the front face).
- Respects `prefers-reduced-motion` and is mobile-responsive.

## Environment

No environment variables are required — this is a fully client-side static deck
with no database, auth, or external APIs. `@vercel/analytics` runs automatically
on Vercel with no key. See `.env.example`.

## Deploy

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Or push to a new GitHub repo and import it in the Vercel dashboard.
