const express = require('express');
const Deck = require('../models/Deck');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const notFound = (res, what = 'Deck') => res.status(404).json({ message: `${what} not found` });

// Light version of a deck for list + progress screens (no card bodies)
const summarize = (d) => ({
  _id: d._id,
  title: d.title,
  description: d.description,
  cardCount: d.cards.length,
  stats: d.stats,
  recent: (d.history || []).slice(-10).map((h) => h.percentage),
  updatedAt: d.updatedAt,
});

// ---------- Decks ----------
router.get('/', wrap(async (req, res) => {
  const decks = await Deck.find().sort({ updatedAt: -1 }).lean();
  res.json(decks.map(summarize));
}));

router.post('/', wrap(async (req, res) => {
  const { title, description } = req.body;
  const deck = await Deck.create({ title, description });
  res.status(201).json(deck);
}));

router.get('/:id', wrap(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);
  res.json(deck);
}));

router.put('/:id', wrap(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);
  if (req.body.title !== undefined) deck.title = req.body.title;
  if (req.body.description !== undefined) deck.description = req.body.description;
  await deck.save();
  res.json(deck);
}));

router.delete('/:id', wrap(async (req, res) => {
  const deck = await Deck.findByIdAndDelete(req.params.id);
  if (!deck) return notFound(res);
  res.status(204).end();
}));

// ---------- Cards (embedded sub-documents) ----------
router.post('/:id/cards', wrap(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);
  deck.cards.push({ question: req.body.question, answer: req.body.answer });
  await deck.save();
  res.status(201).json(deck);
}));

router.put('/:id/cards/:cardId', wrap(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);
  const card = deck.cards.id(req.params.cardId);
  if (!card) return notFound(res, 'Card');
  if (req.body.question !== undefined) card.question = req.body.question;
  if (req.body.answer !== undefined) card.answer = req.body.answer;
  await deck.save();
  res.json(deck);
}));

router.delete('/:id/cards/:cardId', wrap(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);
  if (!deck.cards.id(req.params.cardId)) return notFound(res, 'Card');
  deck.cards.pull(req.params.cardId);
  await deck.save();
  res.json(deck);
}));

// ---------- Quiz results (the "mini twist") ----------
router.post('/:id/attempts', wrap(async (req, res) => {
  const score = Number(req.body.score);
  const total = Number(req.body.total);
  if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) {
    return res.status(400).json({ message: 'score and total must be whole numbers with 0 <= score <= total' });
  }

  const deck = await Deck.findById(req.params.id);
  if (!deck) return notFound(res);

  const percentage = Math.round((score / total) * 100);
  const isNewBest = percentage > deck.stats.bestPercentage;

  deck.stats.attempts += 1;
  deck.stats.bestPercentage = Math.max(deck.stats.bestPercentage, percentage);
  deck.stats.lastPercentage = percentage;
  deck.stats.lastTakenAt = new Date();

  deck.history.push({ score, total, percentage });
  if (deck.history.length > 20) deck.history.splice(0, deck.history.length - 20);

  await deck.save();
  res.json({ stats: deck.stats, percentage, isNewBest });
}));

module.exports = router;
