const express = require('express');
const { getHabits, createHabit, toggleHabitToday, deleteHabit } = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All habit routes require auth

router.route('/').get(getHabits).post(createHabit);
router.route('/:id').delete(deleteHabit);
router.route('/:id/toggle').put(toggleHabitToday);

module.exports = router;
