const Habit = require('../models/Habit');
const User = require('../models/User');
const { createSystemNotification } = require('./notificationController');

const HABIT_POINTS = 5;

// @desc    Get all habits for logged-in user
// @route   GET /api/habits
// @access  Private
const getHabits = async (req, res, next) => {
    try {
        const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });

        // PROACTIVE STREAK WARNING
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(new Date().getTime() - 86400000).toISOString().split('T')[0];

        for (const h of habits) {
            const completedYesterday = h.completedDates.includes(yesterday);
            const completedToday = h.completedDates.includes(today);

            if (completedYesterday && !completedToday) {
                await createSystemNotification(
                    req.user._id,
                    'streak_warning',
                    `NEURAL WARNING: Consistency loop "${h.name}" is at risk. Sync required before local day end.`,
                    h._id
                );
            }
        }

        res.status(200).json({ success: true, data: habits });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a habit
// @route   POST /api/habits
// @access  Private
const createHabit = async (req, res, next) => {
    try {
        const { name, description, frequency, duration, categoryId } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Habit name is required' });
        if (!frequency) return res.status(400).json({ success: false, message: 'Frequency is required' });
        if (!duration) return res.status(400).json({ success: false, message: 'Duration is required' });

        // Gating: Free users limited to 5 habits
        if (req.user.plan !== 'premium') {
            const count = await Habit.countDocuments({ userId: req.user._id });
            if (count >= 5) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Free plan limit reached (5 habits). Please upgrade to Premium for unlimited habits!' 
                });
            }
        }

        const habit = await Habit.create({
            userId: req.user._id,
            name,
            description,
            frequency,
            duration,
            categoryId: categoryId || null
        });
        res.status(201).json({ success: true, data: habit });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle today's completion for a habit
// @route   PUT /api/habits/:id/toggle
// @access  Private
const toggleHabitToday = async (req, res, next) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
        if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

        const today = new Date().toISOString().split('T')[0];
        const isCompletedToday = habit.completedDates.includes(today);

        if (isCompletedToday) {
            habit.completedDates = habit.completedDates.filter((d) => d !== today);
            habit.streak = Math.max(0, habit.streak - 1);
        } else {
            habit.completedDates.push(today);
            habit.streak += 1;
            // Award points for completing a habit today
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: HABIT_POINTS } });

            // MILESTONE NOTIFICATION
            if (habit.streak > 0 && habit.streak % 7 === 0) {
                await createSystemNotification(
                    req.user._id,
                    'streak_warning', // Reusing streak_warning category for consistency-related praise
                    `MILESTONE REACHED: Neural Stability for "${habit.name}" synchronized for ${habit.streak} days. Massive energy detected.`,
                    habit._id
                );
            }
        }

        await habit.save();
        res.status(200).json({ success: true, data: habit });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
const deleteHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
        res.status(200).json({ success: true, message: 'Habit deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHabits, createHabit, toggleHabitToday, deleteHabit };
