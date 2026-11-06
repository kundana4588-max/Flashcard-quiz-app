import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function DeckList({ onEdit, onStudy }) {
  const [decks, setDecks] = useState(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = () =>
    api.listDecks().then(setDecks).catch((e) => {
      setError(e.message);
      setDecks([]);
    });

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const deck = await api.createDeck({ title, description });
      setTitle('');
      setDescription('');
      onEdit(deck._id); // jump straight to adding cards
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (deck) => {
    if (!window.confirm(`Delete "${deck.title}" and its ${deck.cardCount} cards?`)) return;
    try {
      await api.deleteDeck(deck._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h1>Your decks</h1>

      <form className="panel new-deck" onSubmit={create}>
        <h2>New deck</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required placeholder="e.g. Spanish verbs" />
        </label>
        <label>
          Description (optional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} placeholder="What is this deck for?" />
        </label>
        <button className="btn primary" type="submit">Create deck</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {decks === null && <p className="muted">Loading decks…</p>}
      {decks && decks.length === 0 && !error && (
        <p className="empty">No decks yet. Create one above, then add question and answer cards.</p>
      )}

      <ul className="deck-grid">
        {decks &&
          decks.map((d) => (
            <li key={d._id} className="deck">
              <div>
                <h3>{d.title}</h3>
                {d.description && <p className="muted">{d.description}</p>}
                <p className="meta">
                  {d.cardCount} {d.cardCount === 1 ? 'card' : 'cards'}
                  {d.stats.attempts > 0 && <> &middot; best {d.stats.bestPercentage}%</>}
                </p>
              </div>
              <div className="actions">
                <button className="btn primary" disabled={d.cardCount === 0} onClick={() => onStudy(d._id)}>Study</button>
                <button className="btn" onClick={() => onEdit(d._id)}>Edit cards</button>
                <button className="btn danger-text" onClick={() => remove(d)}>Delete</button>
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
