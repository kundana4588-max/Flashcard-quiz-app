import { useState } from 'react';
import DeckList from './components/DeckList.jsx';
import DeckEditor from './components/DeckEditor.jsx';
import Quiz from './components/Quiz.jsx';
import Progress from './components/Progress.jsx';

export default function App() {
  const [view, setView] = useState({ name: 'decks' });
  const go = (name, deckId) => setView({ name, deckId });
  const inDecks = view.name === 'decks' || view.name === 'editor';

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go('decks')}>Flashdeck</button>
        <nav aria-label="Main">
          <button className={inDecks ? 'active' : ''} onClick={() => go('decks')}>Decks</button>
          <button className={view.name === 'progress' ? 'active' : ''} onClick={() => go('progress')}>Progress</button>
        </nav>
      </header>

      <main>
        {view.name === 'decks' && (
          <DeckList onEdit={(id) => go('editor', id)} onStudy={(id) => go('quiz', id)} />
        )}
        {view.name === 'editor' && (
          <DeckEditor deckId={view.deckId} onBack={() => go('decks')} onStudy={() => go('quiz', view.deckId)} />
        )}
        {view.name === 'quiz' && (
          <Quiz deckId={view.deckId} onExit={() => go('decks')} onEdit={() => go('editor', view.deckId)} />
        )}
        {view.name === 'progress' && <Progress onStudy={(id) => go('quiz', id)} />}
      </main>
    </div>
  );
}
