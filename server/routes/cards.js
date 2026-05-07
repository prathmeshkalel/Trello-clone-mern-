const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const { protect } = require('../middleware/auth');

// @route   GET /api/cards/:listId
router.get('/:listId', protect, async (req, res) => {
  try {
    const cards = await Card.find({ list: req.params.listId })
      .sort({ position: 1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/cards
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, listId, boardId, position } = req.body;
    const card = await Card.create({
      title,
      description,
      list: listId,
      board: boardId,
      position
    });
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/cards/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/cards/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;