import { useEffect, useReducer, useState } from 'react';
import { api } from '../api.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// round: 'full' = whole deck (score is saved), 'retry' = only missed cards (practice, not saved)
const start = (cards, round = 'full') => ({
  queue: shuffle(cards),
  index: 0,
  revealed: false,
  results: [],
  phase: 'playing', // 'playing' -> 'done'
  round,
  total: cards.length,
});

// The whole multi-step quiz flow lives in one reducer.
function reducer(state, action) {
  switch (action.type) {
    case 'REVEAL':
      return state.phase === 'playing' ? { ...state, revealed: true } : state;

    case 'MARK': {
      if (state.phase !== 'playing' || !state.revealed) return state;
      const results = [...state.results, { card: state.queue[state.index], correct: action.correct }];
      const next = state.index + 1;
      if (next >= state.queue.length) return { ...state, results, phase: 'done' };
      return { ...state, results, index: next, revealed: false };
    }

    case 'RETRY_MISSED':
      return start(state.results.filter((r) => !r.correct).map((r) => r.card), 'retry');

    case 'RESTART':
      return start(action.cards);

    default:
      return state;
  }
}

export default function Quiz({ deckId, onExit, onEdit }) {
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDeck(deckId).then(setDeck).catch((e) => setError(e.message));
  }, [deckId]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!deck) return <p className="muted">Loading deck…</p>;
  if (deck.cards.length === 0) {
    return (
      <section>
        <p className="empty">This deck has no cards to study yet.</p>
        <button className="btn primary" onClick={onEdit}>Add cards</button>
      </section>
    );
  }
  return <QuizRun deck={deck} onExit={onExit} />;
}

function QuizRun({ deck, onExit }) {
  const [state, dispatch] = useReducer(reducer, deck.cards, (cards) => start(cards));
  const [save, setSave] = useState({ status: 'idle' });

  const score = state.results.filter((r) => r.correct).length;
  const missed = state.results.length - score;
  const percentage = state.total ? Math.round((score / state.total) * 100) : 0;

  // Save the score once a full-deck run finishes
  useEffect(() => {
    if (state.phase !== 'done' || state.round !== 'full') return;
    let cancelled = false;
    setSave({ status: 'saving' });
    api
      .saveAttempt(deck._id, { score, total: state.total })
      .then((r) => !cancelled && setSave({ status: 'saved', ...r }))
      .catch((e) => !cancelled && setSave({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.round]);

  // Keyboard: Space/Enter flips, Left = missed, Right = got it
  useEffect(() => {
    const onKey = (e) => {
      if (state.phase !== 'playing') return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!state.revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        dispatch({ type: 'REVEAL' });
      } else if (state.revealed && e.key === 'ArrowRight') {
        dispatch({ type: 'MARK', correct: true });
      } else if (state.revealed && e.key === 'ArrowLeft') {
        dispatch({ type: 'MARK', correct: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.phase, state.revealed]);

  const restart = () => {
    setSave({ status: 'idle' });
    dispatch({ type: 'RESTART', cards: deck.cards });
  };

  if (state.phase === 'done') {
    return (
      <section className="results">
        <h1>{state.round === 'retry' ? 'Practice round done' : 'Round complete'}</h1>
        <p className="big-score">{score}<span> of {state.total} correct</span></p>
        {state.round === 'full' && <p className="pct">{percentage}%</p>}

        {state.round === 'full' && save.status === 'saving' && <p className="muted">Saving your score…</p>}
        {state.round === 'full' && save.status === 'saved' && (
          <p className="saved">
            {save.isNewBest ? 'New best score saved.' : `Score saved. Your best is ${save.stats.bestPercentage}%.`}
          </p>
        )}
        {state.round === 'full' && save.status === 'error' && (
          <p className="error" role="alert">Your score wasn't saved: {save.message}</p>
        )}
        {state.round === 'retry' && <p className="muted">Practice rounds don't change your saved score.</p>}

        {missed > 0 && (
          <div className="missed">
            <h2>Missed cards</h2>
            <ul>
              {state.results.filter((r) => !r.correct).map((r) => (
                <li key={r.card._id}><strong>{r.card.question}</strong><br />{r.card.answer}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="actions">
          {missed > 0 && <button className="btn primary" onClick={() => dispatch({ type: 'RETRY_MISSED' })}>Practice {missed} missed</button>}
          <button className="btn" onClick={restart}>Study the full deck again</button>
          <button className="btn" onClick={onExit}>Back to decks</button>
        </div>
      </section>
    );
  }

  const card = state.queue[state.index];
  const progress = (state.index / state.queue.length) * 100;

  return (
    <section className="quiz">
      <div className="row-between">
        <h1>{deck.title}</h1>
        <button className="link" onClick={onExit}>End session</button>
      </div>
      <p className="muted">
        {state.round === 'retry' ? 'Practice: missed cards. ' : ''}Card {state.index + 1} of {state.queue.length}
      </p>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className={`flip ${state.revealed ? 'is-flipped' : ''}`} key={card._id}>
        <div className="flip-inner">
          <div className="face front index-card" aria-hidden={state.revealed}>
            <p className="face-label">Question</p>
            <p className="face-text">{card.question}</p>
          </div>
          <div className="face back index-card" aria-hidden={!state.revealed}>
            <p className="face-label">Answer</p>
            <p className="face-text">{card.answer}</p>
          </div>
        </div>
      </div>

      {!state.revealed ? (
        <div className="actions center">
          <button className="btn primary big" onClick={() => dispatch({ type: 'REVEAL' })}>Show answer</button>
        </div>
      ) : (
        <div className="actions center">
          <button className="btn miss big" onClick={() => dispatch({ type: 'MARK', correct: false })}>Missed it</button>
          <button className="btn hit big" onClick={() => dispatch({ type: 'MARK', correct: true })}>Got it</button>
        </div>
      )}
      <p className="hint muted">Space shows the answer. Left arrow marks missed, right arrow marks got it.</p>
    </section>
  );
}
