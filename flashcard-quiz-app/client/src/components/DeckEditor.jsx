import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function DeckEditor({ deckId, onBack, onStudy }) {
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [editing, setEditing] = useState(null); // { id, question, answer }

  const adopt = (d) => {
    setDeck(d);
    setTitle(d.title);
    setDescription(d.description || '');
  };

  useEffect(() => {
    api.getDeck(deckId).then(adopt).catch((e) => setError(e.message));
  }, [deckId]);

  const run = async (fn) => {
    setError('');
    try {
      return await fn();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveDetails = (e) => {
    e.preventDefault();
    run(async () => adopt(await api.updateDeck(deckId, { title, description })));
  };

  const addCard = (e) => {
    e.preventDefault();
    run(async () => {
      adopt(await api.addCard(deckId, { question: q, answer: a }));
      setQ('');
      setA('');
    });
  };

  const saveEdit = (e) => {
    e.preventDefault();
    run(async () => {
      adopt(await api.updateCard(deckId, editing.id, { question: editing.question, answer: editing.answer }));
      setEditing(null);
    });
  };

  const removeCard = (id) => run(async () => adopt(await api.deleteCard(deckId, id)));

  if (!deck) return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading deck…</p>;

  return (
    <section>
      <button className="link" onClick={onBack}>Back to decks</button>
      <h1>{deck.title}</h1>

      {error && <p className="error" role="alert">{error}</p>}

      <form className="panel" onSubmit={saveDetails}>
        <h2>Deck details</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} />
        </label>
        <button className="btn" type="submit">Save details</button>
      </form>

      <form className="panel" onSubmit={addCard}>
        <h2>Add a card</h2>
        <label>
          Question
          <textarea value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} rows={2} required />
        </label>
        <label>
          Answer
          <textarea value={a} onChange={(e) => setA(e.target.value)} maxLength={1000} rows={2} required />
        </label>
        <button className="btn primary" type="submit">Add card</button>
      </form>

      <div className="row-between">
        <h2>{deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}</h2>
        <button className="btn primary" disabled={deck.cards.length === 0} onClick={onStudy}>Study this deck</button>
      </div>

      {deck.cards.length === 0 && <p className="empty">This deck has no cards yet. Add your first question above.</p>}

      <ul className="card-list">
        {deck.cards.map((c) =>
          editing && editing.id === c._id ? (
            <li key={c._id}>
              <form className="panel" onSubmit={saveEdit}>
                <label>
                  Question
                  <textarea rows={2} value={editing.question} maxLength={500} required onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
                </label>
                <label>
                  Answer
                  <textarea rows={2} value={editing.answer} maxLength={1000} required onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
                </label>
                <div className="actions">
                  <button className="btn primary" type="submit">Save card</button>
                  <button className="btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </form>
            </li>
          ) : (
            <li key={c._id} className="mini-card">
              <div>
                <p className="q">{c.question}</p>
                <p className="a">{c.answer}</p>
              </div>
              <div className="actions">
                <button className="btn" onClick={() => setEditing({ id: c._id, question: c.question, answer: c.answer })}>Edit</button>
                <button className="btn danger-text" onClick={() => removeCard(c._id)}>Delete</button>
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
