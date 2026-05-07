const express = require('express');
const router = express.Router();
const List = require('../models/List');
const { protect } = require('../middleware/auth');

// @route   GET /api/lists/:boardId
router.get('/:boardId', protect, async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId })
      .sort({ position: 1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/lists
router.post('/', protect, async (req, res) => {
  try {
    const { title, boardId, position } = req.body;
    const list = await List.create({
      title,
      board: boardId,
      position
    });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/lists/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/lists/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await List.findByIdAndDelete(req.params.id);
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;