const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const { protect } = require('../middleware/auth');

// @route   GET /api/boards
router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.user.id });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/boards
router.post('/', protect, async (req, res) => {
  try {
    const { title, background } = req.body;
    const board = await Board.create({
      title,
      background,
      owner: req.user.id
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/boards/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/boards/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/boards/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;