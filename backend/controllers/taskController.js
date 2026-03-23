const Task = require('../models/Task');
const User = require('../models/User');
const Battle = require('../models/Battle');
const { createSystemNotification } = require('./notificationController');
const Notification = require('../models/Notification');
const SquadActivity = require('../models/SquadActivity');

const TASK_POINTS = 10;

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
    try {
        const query = { 
            $or: [
                { userId: req.user._id },
                { collaborators: req.user._id }
            ]
        };
        // Optionally filter by parent (e.g., if we want sub-tasks for a big task)
        if (req.query.parentId) {
            query.parentId = req.query.parentId;
        } else if (req.query.onlyBig) {
            query.isBigTask = true;
        }

        const tasks = await Task.find(query)
            .populate('categoryId')
            .populate('parentId', 'title')
            .populate('userId', 'name avatar avatarConfig')
            .populate('collaborators', 'name avatar avatarConfig')
            .sort({ createdAt: -1 });

        // PROACTIVE DEADLINE CHECK
        const now = new Date();
        const soon = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
        
        const urgentTasks = tasks.filter(t => 
            t.status !== 'completed' && 
            t.deadline && 
            new Date(t.deadline) <= soon && 
            new Date(t.deadline) > now
        );

        for (const ut of urgentTasks) {
            // Check if notification already exists to avoid spam
            const existing = await Notification.findOne({
                recipient: req.user._id,
                type: 'task_deadline',
                refId: ut._id,
                createdAt: { $gt: new Date(now.getTime() - (12 * 60 * 60 * 1000)) } // Only notify once every 12 hours
            });

            if (!existing) {
                await createSystemNotification(
                    req.user._id,
                    'task_deadline',
                    `NEURAL ALERT: Task "${ut.title}" deadline is approaching. Sequence sync required.`,
                    ut._id
                );
            }
        }

        // OVERDUE CHECK
        const overdueTasks = tasks.filter(t => 
            t.status !== 'completed' && 
            t.deadline && 
            new Date(t.deadline) < now
        );

        for (const ot of overdueTasks) {
            const existing = await Notification.findOne({
                recipient: req.user._id,
                type: 'task_overdue',
                refId: ot._id,
                createdAt: { $gt: new Date(now.getTime() - (24 * 60 * 60 * 1000)) } // Notify once per day
            });

            if (!existing) {
                await createSystemNotification(
                    req.user._id,
                    'task_overdue',
                    `MISSION OVERDUE: Task "${ot.title}" has exceeded its deadline. Immediate corrective action required.`,
                    ot._id
                );
            }
        }

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
    try {
        const {
            title, description, priority, deadline, categoryId,
            estimatedTime, alertsEnabled, isBigTask, parentId,
            notes, totalWork, completedWork
        } = req.body;

        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        // Gating: Advanced features (Big Tasks, Sub-tasks, Work Counters, Notes) are PREMIUM only
        if (req.user.plan !== 'premium') {
            if (isBigTask || parentId || (totalWork > 0) || notes) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Container tasks, Sub-tasks, Work counters, and Notes are Premium features. Please upgrade to unlock them!' 
                });
            }
        }

        const task = await Task.create({
            userId: req.user._id,
            title,
            description,
            priority,
            deadline,
            categoryId,
            estimatedTime,
            alertsEnabled,
            isBigTask,
            parentId,
            notes,
            totalWork,
            completedWork,
            collaborators: req.body.collaborators || [],
            isSynergyTask: req.body.isSynergyTask || false
        });
        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        const wasCompleted = task.status === 'completed';
        const isNowCompleted = req.body.status === 'completed';

        // Neural Firewall: Mass Assignment Lockdown
        const { title, description, priority, deadline, categoryId, status, notes, totalWork, completedWork } = req.body;
        
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (deadline !== undefined) task.deadline = deadline;
        if (categoryId !== undefined) task.categoryId = categoryId;
        if (status !== undefined) task.status = status;
        if (notes !== undefined) task.notes = notes;
        if (totalWork !== undefined) task.totalWork = totalWork;
        if (completedWork !== undefined) task.completedWork = completedWork;

        if (isNowCompleted && !task.completedAt) task.completedAt = new Date();

        await task.save();

        // Award points and update streak when task first completed
        if (!wasCompleted && isNowCompleted) {
            const user = await User.findById(req.user._id);
            const now = new Date();
            const today = new Date(now).setHours(0, 0, 0, 0);
            const yesterday = new Date(today - 86400000).getTime();
            const lastDate = user.lastTaskCompletionDate ? new Date(user.lastTaskCompletionDate).setHours(0, 0, 0, 0) : null;

            const taskPoints = task.isSynergyTask ? Math.floor(TASK_POINTS * 1.5) : TASK_POINTS;

            let update = { 
                $inc: { points: taskPoints }, 
                $set: { lastTaskCompletionDate: now },
                $addToSet: { streakHistory: today } // Track unique dates of completion
            };

            if (!lastDate) {
                update.$set.streak = 1;
            } else if (lastDate === yesterday) {
                update.$inc.streak = 1;
                // Award bonus every 7-day streak milestone
                const newStreak = (user.streak || 0) + 1;
                if (newStreak % 7 === 0) {
                    update.$inc.points = (update.$inc.points || 0) + 100;
                    if (user.plan === 'premium') {
                        update.$inc.streakFreezes = 1;
                    }
                }
            } else if (lastDate < yesterday) {
                // Streak Freeze logic for Premium users
                if (user.plan === 'premium' && user.streakFreezes > 0 && lastDate === new Date(today - (86400000 * 2)).setHours(0,0,0,0)) {
                    // If missed exactly one day and has a freeze
                    update.$inc.streak = 1;
                    update.$inc.streakFreezes = -1;
                } else {
                    update.$set.streak = 1;
                }
            }
            // if lastDate === today, streak is already counted for today

            await User.findByIdAndUpdate(req.user._id, update);

            // Log Squad Activity
            await SquadActivity.create({
                user: req.user._id,
                type: 'task_completed',
                details: `completed "${task.title}"`
            });
        } else if (wasCompleted && !isNowCompleted) {
            // Deduct points if task completion is undone
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: -TASK_POINTS } });
        }

        // Update Battle Intensity if applicable
        if (req.body.status === 'completed') {
            const activeBattle = await Battle.findOne({
                status: 'active',
                'participants.user': req.user._id
            });

            if (activeBattle) {
                const participant = activeBattle.participants.find(p => p.user.toString() === req.user._id.toString());
                if (participant) {
                    participant.tasksCompleted += 1;
                    participant.pointsEarned += (task.points || 0);
                    // If it was a tagged battle task
                    if (participant.battleTasks.includes(task._id)) {
                        participant.pointsEarned += 50; // Bonus intensity
                    }

                    activeBattle.logs.push({
                        message: `${req.user.name} SECURED A MISSION: ${task.title}`,
                        timestamp: new Date()
                    });

                    await activeBattle.save();

                    // Update SquadRoom total points if roomId exists
                    if (activeBattle.roomId) {
                        const SquadRoom = require('../models/SquadRoom');
                        const pointsAwarded = participant.battleTasks.includes(task._id) ? 50 : 10;
                        await SquadRoom.findByIdAndUpdate(activeBattle.roomId, {
                            $inc: { squadPoints: pointsAwarded }
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
