# Flashdeck: MERN Flashcard Quiz Application

Build custom study decks of question/answer cards, quiz yourself, and track your scores.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node.

## What it teaches

1. **Embedded sub-documents in MongoDB.** One `Deck` document contains an array of `Card` sub-documents
   (`server/models/Deck.js`). Cards are added, edited and removed through `deck.cards.push()`, `.id()` and `.pull()`.
2. **Multi-step quiz state in React.** `client/src/components/Quiz.jsx` runs the whole flow
   (shuffle, reveal, mark, finish, retry missed) in a single `useReducer`.
3. **Mini twist: saved progress.** When a full-deck run finishes, the score is POSTed to
   `/api/decks/:id/attempts`. The server updates `stats` (attempts, best %, latest %) and keeps the last 20 runs.
   The Progress screen reads these back.

## Setup

Requirements: Node 18+ and a running MongoDB (local, or a free Atlas cluster).

```bash
npm run install:all        # installs root, server and client dependencies
```

Edit `server/.env` if your MongoDB is not at `mongodb://127.0.0.1:27017/flashcards`
(for Atlas, paste your connection string into `MONGO_URI`).

```bash
npm run dev                # API on :5000, React app on http://localhost:5173
```

### Production-style run

```bash
npm run build
NODE_ENV=production npm start   # Express serves the built React app on :5000
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/decks` | List decks (card count, stats, recent scores) |
| POST | `/api/decks` | Create a deck `{ title, description }` |
| GET / PUT / DELETE | `/api/decks/:id` | Read, rename, delete a deck |
| POST | `/api/decks/:id/cards` | Add a card `{ question, answer }` |
| PUT / DELETE | `/api/decks/:id/cards/:cardId` | Edit or remove a card |
| POST | `/api/decks/:id/attempts` | Save a result `{ score, total }` |

## Project layout

```
server/   Express API (models/Deck.js, routes/decks.js, server.js)
client/   React app (components: DeckList, DeckEditor, Quiz, Progress)
```

## Ideas to extend it

- User accounts (JWT) so each person has their own decks
- Spaced repetition: track per-card correctness and show weak cards more often
- Import cards from CSV
