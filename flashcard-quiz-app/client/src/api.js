const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let message = 'Something went wrong. Check that the server is running.';
    try {
      message = (await res.json()).message || message;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listDecks: () => request('/decks'),
  getDeck: (id) => request(`/decks/${id}`),
  createDeck: (body) => request('/decks', { method: 'POST', body }),
  updateDeck: (id, body) => request(`/decks/${id}`, { method: 'PUT', body }),
  deleteDeck: (id) => request(`/decks/${id}`, { method: 'DELETE' }),
  addCard: (id, body) => request(`/decks/${id}/cards`, { method: 'POST', body }),
  updateCard: (id, cardId, body) => request(`/decks/${id}/cards/${cardId}`, { method: 'PUT', body }),
  deleteCard: (id, cardId) => request(`/decks/${id}/cards/${cardId}`, { method: 'DELETE' }),
  saveAttempt: (id, body) => request(`/decks/${id}/attempts`, { method: 'POST', body }),
};
