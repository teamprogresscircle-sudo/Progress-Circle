const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Session = require('../models/Session');
const ScheduleBlock = require('../models/ScheduleBlock');
const dayjs = require('dayjs');

// @desc    Get all calendar events for a date range
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const userId = req.user._id;

        const startDate = start ? new Date(start) : dayjs().startOf('month').toDate();
        const endDate = end ? new Date(end) : dayjs().endOf('month').toDate();

        const [tasks, scheduleBlocks] = await Promise.all([
            Task.find({
                userId,
                deadline: { $gte: startDate, $lte: endDate }
            }).populate('categoryId', 'name color'),

            ScheduleBlock.find({
                userId,
                startTime: { $gte: startDate, $lte: endDate }
            }).populate({
                path: 'taskId',
                populate: { path: 'categoryId', select: 'name color' }
            })
        ]);

        const events = [];

        // Tasks only — each colored by its category
        tasks.forEach(task => {
            events.push({
                id: `task-${task._id}`,
                title: task.title,
                start: task.deadline,
                end: task.deadline,
                type: 'task',
                status: task.status,
                priority: task.priority,
                categoryName: task.categoryId?.name || null,
                categoryId: task.categoryId?._id || null,
                color: task.categoryId?.color || (task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981'),
                allDay: false
            });
        });

        // Scheduled Blocks (task-linked, optionally timed)
        scheduleBlocks.forEach(block => {
            const cat = block.taskId?.categoryId;
            events.push({
                id: `block-${block._id}`,
                title: block.title,
                start: block.startTime,
                end: block.endTime || block.startTime,
                type: 'block',
                categoryName: cat?.name || null,
                categoryId: cat?._id || null,
                color: cat?.color || block.color || '#6366f1',
                allDay: !block.startTime,
                notes: block.notes
            });
        });

        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a schedule block
// @route   POST /api/calendar/blocks
// @access  Private
const createScheduleBlock = async (req, res, next) => {
    try {
        const { title, startTime, endTime, type, color, notes, taskId, date } = req.body;
        
        // Build startTime: use provided time string or fall back to just the date
        let resolvedStart = startTime ? new Date(startTime) : (date ? new Date(date) : null);
        let resolvedEnd = endTime ? new Date(endTime) : resolvedStart;
        
        const block = await ScheduleBlock.create({
            userId: req.user._id,
            taskId: taskId || null,
            title,
            startTime: resolvedStart,
            endTime: resolvedEnd,
            type,
            color,
            notes
        });
        // Populate the created block for the response
        await block.populate({ path: 'taskId', populate: { path: 'categoryId', select: 'name color' } });
        res.status(201).json({ success: true, data: block });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a schedule block
// @route   DELETE /api/calendar/blocks/:id
// @access  Private
const deleteScheduleBlock = async (req, res, next) => {
    try {
        const block = await ScheduleBlock.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
        res.status(200).json({ success: true, message: 'Block deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCalendarEvents, createScheduleBlock, deleteScheduleBlock };
