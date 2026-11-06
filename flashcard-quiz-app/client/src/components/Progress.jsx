import { useEffect, useState } from 'react';
import { api } from '../api.js';

const when = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never');

export default function Progress({ onStudy }) {
  const [decks, setDecks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listDecks().then(setDecks).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!decks) return <p className="muted">Loading progress…</p>;

  const studied = decks.filter((d) => d.stats.attempts > 0);
  const totalAttempts = decks.reduce((n, d) => n + d.stats.attempts, 0);
  const avgBest = studied.length ? Math.round(studied.reduce((n, d) => n + d.stats.bestPercentage, 0) / studied.length) : 0;

  return (
    <section>
      <h1>Progress</h1>

      <dl className="summary">
        <div><dt>Decks studied</dt><dd>{studied.length} of {decks.length}</dd></div>
        <div><dt>Quiz runs</dt><dd>{totalAttempts}</dd></div>
        <div><dt>Average best score</dt><dd>{studied.length ? `${avgBest}%` : 'None yet'}</dd></div>
      </dl>

      {decks.length === 0 && <p className="empty">Create a deck and finish a quiz to see your scores here.</p>}

      <ul className="progress-list">
        {decks.map((d) => (
          <li key={d._id} className="panel">
            <div className="row-between">
              <h3>{d.title}</h3>
              <button className="btn" disabled={d.cardCount === 0} onClick={() => onStudy(d._id)}>Study</button>
            </div>

            {d.stats.attempts === 0 ? (
              <p className="muted">Not studied yet. {d.cardCount} {d.cardCount === 1 ? 'card' : 'cards'} waiting.</p>
            ) : (
              <>
                <div className="meter-row">
                  <span>Best</span>
                  <div className="meter"><div style={{ width: `${d.stats.bestPercentage}%` }} /></div>
                  <strong>{d.stats.bestPercentage}%</strong>
                </div>
                <div className="meter-row">
                  <span>Latest</span>
                  <div className="meter alt"><div style={{ width: `${d.stats.lastPercentage}%` }} /></div>
                  <strong>{d.stats.lastPercentage}%</strong>
                </div>
                <p className="meta">
                  {d.stats.attempts} {d.stats.attempts === 1 ? 'run' : 'runs'} &middot; last on {when(d.stats.lastTakenAt)}
                </p>
                {d.recent.length > 1 && (
                  <div className="spark" aria-label={`Last ${d.recent.length} scores`}>
                    {d.recent.map((p, i) => (
                      <span key={i} title={`${p}%`} style={{ height: `${Math.max(p, 4)}%` }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
