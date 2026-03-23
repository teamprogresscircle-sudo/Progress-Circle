const Goal = require('../models/Goal');
const User = require('../models/User');

const GOAL_COMPLETE_POINTS = 50;

// @desc    Get all goals for logged-in user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
    try {
        const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
    try {
        const { title, description, targetDate } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Goal title is required' });

        const goal = await Goal.create({ userId: req.user._id, title, description, targetDate });
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a goal (including progress)
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

        const wasCompleted = goal.status === 'completed';
        const isNowCompleted = req.body.status === 'completed';

        Object.assign(goal, req.body);
        if (isNowCompleted && !goal.completedAt) goal.completedAt = new Date();

        await goal.save();

        // Award large bonus when goal first completed
        if (!wasCompleted && isNowCompleted) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: GOAL_COMPLETE_POINTS } });
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
        res.status(200).json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
