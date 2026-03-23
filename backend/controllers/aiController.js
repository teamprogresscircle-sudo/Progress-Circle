const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Session = require('../models/Session');
const User = require('../models/User');

// V3 Helper: Trend Analysis
function calculateTrends(currentSessions, pastSessions) {
    const currentTotal = currentSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const pastTotal = pastSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    
    if (pastTotal === 0) return { trend: 'up', percentage: 100 };
    const diff = ((currentTotal - pastTotal) / pastTotal) * 100;
    return {
        trend: diff >= 0 ? 'up' : 'down',
        percentage: Math.abs(Math.round(diff))
    };
}

// V3 Helper: Sector Focus
function calculateSectorFocus(sessions) {
    const sectors = {};
    sessions.forEach(s => {
        let sector = s.classification || 'Other';
        
        // Fix for legacy encrypted classifications showing up in Astra Assistant
        // Encrypted strings from mongoose-field-encryption typically look like long hex + ":" + hex
        if (sector.length > 30 && sector.includes(':')) {
            sector = 'Universal'; // Fallback to a clean default
        }
        
        sectors[sector] = (sectors[sector] || 0) + (s.duration || 0);
    });
    return Object.entries(sectors).sort((a, b) => b[1] - a[1])[0] || [null, 0];
}

const getAstraAnalysis = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const [tasks, habits, thisWeekSessions, lastWeekSessions] = await Promise.all([
            Task.find({ userId, createdAt: { $gt: startOfLastWeek } }),
            Habit.find({ userId }),
            Session.find({ userId, startTime: { $gt: startOfThisWeek }, type: 'focus' }),
            Session.find({ userId, startTime: { $gt: startOfLastWeek, $lt: startOfThisWeek }, type: 'focus' })
        ]);

        // 1. Productivity Trends
        const trend = calculateTrends(thisWeekSessions, lastWeekSessions);
        const [topSector, sectorTime] = calculateSectorFocus(thisWeekSessions);
        
        // 2. Task Velocity
        const completedThisWeek = tasks.filter(t => t.status === 'completed' && t.completedAt > startOfThisWeek).length;
        const tasksRemaining = tasks.filter(t => t.status !== 'completed').length;

        // 3. Peak Hour (from all sessions)
        const allSessions = [...thisWeekSessions, ...lastWeekSessions];
        const hours = new Array(24).fill(0);
        allSessions.forEach(s => hours[new Date(s.startTime).getHours()] += s.duration || 0);
        const peakH = hours.indexOf(Math.max(...hours));
        const peakDisplay = peakH === -1 ? null : `${peakH % 12 || 12} ${peakH >= 12 ? 'PM' : 'AM'}`;

        // 4. Strategic Insights (V3)
        let entries = [];
        
        if (trend.trend === 'up') {
            entries.push(`Your focus output is **up ${trend.percentage}%** compared to last week. The warp drive is stabilizing.`);
        } else if (trend.percentage > 10) {
            entries.push(`Alert: Power levels dropped by **${trend.percentage}%**. You performed better last week—scan for burnout risk.`);
        }

        if (topSector) {
            entries.push(`Your primary energy is focused on the **${topSector}** sector (${Math.round(sectorTime/60 * 10)/10}h).`);
        }

        if (tasksRemaining > 10) {
            entries.push(`Critical payload: **${tasksRemaining} tasks** are still in the hold. Jettison small items to clear the path.`);
        } else if (tasksRemaining > 0) {
            entries.push(`Clear skies ahead. Only **${tasksRemaining} missions** left for a full systems reset.`);
        }

        if (peakDisplay) {
            entries.push(`Efficiency spike detected at **${peakDisplay}**. Allocate 'Deep Work' to this window.`);
        }

        res.status(200).json({
            success: true,
            data: {
                log: entries.join(' '),
                stats: {
                    trend: trend.trend,
                    trendValue: trend.percentage,
                    topSector,
                    completedCount: completedThisWeek,
                    peakHour: peakDisplay
                },
                recommendation: trend.trend === 'down' 
                    ? `Prioritize 2 high-value tasks in '${topSector}' today to regain momentum.`
                    : `Your current trajectory is optimal. Double down on '${topSector || 'your goals'}' during your peak hour.`
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getAstraAnalysis };
