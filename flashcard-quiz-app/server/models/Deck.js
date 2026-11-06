const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-document: every card lives INSIDE its deck (embedded array), not in its own collection.
const cardSchema = new Schema(
  {
    question: { type: String, required: [true, 'Question is required'], trim: true, maxlength: 500 },
    answer: { type: String, required: [true, 'Answer is required'], trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Sub-document: one entry per completed quiz run (kept to the latest 20).
const attemptSchema = new Schema(
  {
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deckSchema = new Schema(
  {
    title: { type: String, required: [true, 'Deck title is required'], trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 240, default: '' },
    cards: [cardSchema],
    stats: {
      attempts: { type: Number, default: 0 },
      bestPercentage: { type: Number, default: 0 },
      lastPercentage: { type: Number, default: 0 },
      lastTakenAt: { type: Date, default: null },
    },
    history: [attemptSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deck', deckSchema);
