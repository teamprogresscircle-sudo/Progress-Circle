const mongoose = require('mongoose');

const scheduleBlockSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        startTime: {
            type: Date,
            default: null,
        },
        endTime: {
            type: Date,
            default: null,
        },
        type: {
            type: String,
            enum: ['focus', 'meeting', 'personal', 'other'],
            default: 'focus',
        },
        color: {
            type: String,
            default: '#6366f1', // Default indigo
        },
        notes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ScheduleBlock', scheduleBlockSchema);
