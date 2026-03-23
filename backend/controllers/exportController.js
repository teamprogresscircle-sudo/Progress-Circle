const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Session = require('../models/Session');
const Nutrition = require('../models/Nutrition');
const Battle = require('../models/Battle');
const Transaction = require('../models/Transaction');
const BodyMetric = require('../models/BodyMetric');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Helper for AI/Neural Feedback Generation
const generateNeuralFeedback = (tasks, habits, sessions) => {
    let feedback = [];
    
    // Task Feedback
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    if (taskCompletionRate >= 80) {
        feedback.push("Task completion velocity is exceptional. Neural pathways are firing efficiently.");
    } else if (taskCompletionRate >= 50) {
        feedback.push("Steady operational output detected. Recommend standardizing daily mission priorities.");
    } else {
        feedback.push("Task sync rate is sub-optimal. Re-align daily objectives to regain momentum.");
    }

    // Focus Feedback
    const totalFocusMins = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + (s.duration || 0), 0);
    if (totalFocusMins > 300) {
        feedback.push("Deep work capacity is at absolute peak performance. Biological exhaustion risk: Low-to-Moderate.");
    } else if (totalFocusMins > 100) {
        feedback.push("Solid foundation of cognitive isolation. Recommend extending deep work intervals by 15%.");
    } else {
        feedback.push("Cognitive isolation extremely limited. High interference detected. Initiate focus defense protocols.");
    }

    // Habit Feedback
    const activeHabits = habits.filter(h => h.streak >= 3).length;
    if (activeHabits >= 3) {
        feedback.push("Biological routines firmly anchored. Automated subroutines functioning perfectly.");
    } else {
        feedback.push("Routine instability detected. Focus on anchoring at least 2 primary habits before expanding.");
    }

    return feedback;
};

// @desc    Export user data to a high-fidelity professional PDF report
// @route   GET /api/export/pdf
// @access  Private (Premium Only)
exports.exportPDF = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = req.user;

        // Fetch user data
        const tasks = await Task.find({ userId }).sort('-createdAt');
        const habits = await Habit.find({ userId }).sort('-streak');
        const sessions = await Session.find({ userId }).sort('-createdAt');
        const nutritionLogs = await Nutrition.find({ userId }).sort('-date').limit(7);
        const battles = await Battle.find({ 'participants.user': userId }).sort('-createdAt').limit(5);
        const transactions = await Transaction.find({ user: userId }).sort('-date').limit(10);
        const metrics = await BodyMetric.find({ user: userId }).sort('-date').limit(3);

        const doc = new PDFDocument({ 
            margin: 0,
            size: 'A4',
            bufferPages: true 
        });

        let filename = `Neural_Archive_${user.name.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // --- PALETTE ---
        const BG = '#0B0B0F';
        const SURFACE = '#12121A';
        const BORDER = '#1f1f2e';
        const PRIMARY = '#6366f1';
        const ACCENT = '#a855f7';
        const TEXT = '#F8FAFC';
        const MUTED = '#64748B';

        const drawSurface = (x, y, w, h) => {
            doc.roundedRect(x, y, w, h, 8).fillAndStroke(SURFACE, BORDER);
        };

        const drawLine = (y) => {
            doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).strokeColor(BORDER).stroke();
        };

        const drawProgressBar = (x, y, w, percent, color) => {
            doc.roundedRect(x, y, w, 4, 2).fill(BORDER);
            doc.roundedRect(x, y, (percent / 100) * w, 4, 2).fill(color);
        };

        // PAGE 1: COVER
        doc.rect(0, 0, 595.28, 841.89).fill(BG);
        
        // Huge watermark
        doc.fillColor(PRIMARY).opacity(0.03).fontSize(140).font('Helvetica-Bold').text('PROGRESS', 0, 250, { align: 'center' });
        doc.text('CIRCLE', { align: 'center' });
        doc.opacity(1);

        // Grid lines (cyber aesthetic)
        for(let i=0; i<850; i+=40) {
            doc.moveTo(0, i).lineTo(595, i).lineWidth(0.5).strokeColor(PRIMARY).strokeOpacity(0.05).stroke();
            doc.moveTo(i, 0).lineTo(i, 842).strokeColor(PRIMARY).strokeOpacity(0.05).stroke();
        }
        doc.strokeOpacity(1);

        // Title
        doc.fillColor(TEXT).fontSize(42).font('Helvetica-Bold').text('NEURAL', 40, 150, { characterSpacing: 2 });
        doc.fillColor(PRIMARY).fontSize(42).font('Helvetica-Bold').text('ARCHIVE', 40, 195, { characterSpacing: 2 });
        
        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('CONFIDENTIAL BIOLOGICAL & OPERATIONAL REPORT', 40, 245, { characterSpacing: 2 });
        doc.rect(40, 265, 60, 3).fill(ACCENT);
        
        // Subject info
        doc.fillColor(TEXT).fontSize(14).font('Helvetica-Bold').text(`SUBJECT: ${user.name.toUpperCase()}`, 40, 650);
        doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(`ID: ${user.id || 'ALPHA-PROTOCOL'}`, 40, 670);
        doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold').text(`SYNC DATE: ${new Date().toISOString().split('T')[0]}`, 40, 690);
        
        doc.rect(40, 750, 515, 1).fill(BORDER);
        doc.fillColor(MUTED).fontSize(8).font('Helvetica').text('DISTRIBUTION: AUTHORIZED EYES ONLY // PROGRESS CIRCLE P-V1', 40, 765, { characterSpacing: 1 });

        // PAGE 2: EXECUTIVE SUMMARY & AI FEEDBACK
        doc.addPage();
        doc.rect(0, 0, 595.28, 841.89).fill(BG);
        
        doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('01 // OVERVIEW & INTELLIGENCE', 40, 40, { characterSpacing: 2 });
        doc.fillColor(TEXT).fontSize(24).text('EXECUTIVE SUMMARY', 40, 60);
        drawLine(100);

        // AI Feedback Block
        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('ASTRA AI INTELLIGENCE FEED', 40, 120, { characterSpacing: 1 });
        drawSurface(40, 140, 515, 130);
        
        const feedback = generateNeuralFeedback(tasks, habits, sessions);
        let fy = 160;
        feedback.forEach((f) => {
            doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold').text(`>`, 60, fy);
            doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(f, 75, fy, { width: 450, lineGap: 4 });
            fy += 35;
        });

        // Top line stats
        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('GLOBAL PERFORMANCE METRICS', 40, 290, { characterSpacing: 1 });
        
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const totalFocus = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + (s.duration || 0), 0);
        const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

        drawSurface(40, 310, 160, 100);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('SYNC VELOCITY', 55, 330, { characterSpacing: 1 });
        doc.fillColor(TEXT).fontSize(32).font('Helvetica-Bold').text(`${taskCompletionRate.toFixed(0)}%`, 55, 355);

        drawSurface(215, 310, 160, 100);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('DEEP FOCUS (MINS)', 230, 330, { characterSpacing: 1 });
        doc.fillColor(ACCENT).fontSize(32).font('Helvetica-Bold').text(`${totalFocus}`, 230, 355);

        drawSurface(390, 310, 165, 100);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('MAX STREAK (DAYS)', 405, 330, { characterSpacing: 1 });
        doc.fillColor('#10b981').fontSize(32).font('Helvetica-Bold').text(`${maxStreak}`, 405, 355);

        // PAGE 3: MISSIONS / TASKS
        doc.addPage();
        doc.rect(0, 0, 595.28, 841.89).fill(BG);
        doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('02 // OPERATIONS', 40, 40, { characterSpacing: 2 });
        doc.fillColor(TEXT).fontSize(24).text('MISSIONS LOG', 40, 60);
        drawLine(100);

        let ty = 125;
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('OBJECTIVE (TASK)', 40, ty, { characterSpacing: 1 });
        doc.text('STATUS', 400, ty, { characterSpacing: 1 });
        doc.text('PRIORITY', 490, ty, { characterSpacing: 1 });
        ty += 20;

        tasks.slice(0, 20).forEach((t, i) => {
            if(ty > 750) {
                doc.addPage();
                doc.rect(0, 0, 595.28, 841.89).fill(BG);
                ty = 50;
            }
            if (i % 2 === 0) doc.roundedRect(30, ty - 8, 535, 25, 4).fill(SURFACE);
            
            const isDone = t.status === 'completed';
            doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(t.title || 'UNKNOWN_NODE', 40, ty, { width: 340, height: 12, lineBreak: false });
            doc.fillColor(isDone ? '#10b981' : '#f59e0b').font('Helvetica-Bold').text(isDone ? 'COMPLETE' : 'ACTIVE', 400, ty);
            doc.fillColor(MUTED).text((t.priority || 'MED').toUpperCase(), 490, ty);
            ty += 30;
        });

        // PAGE 4: HABITS
        doc.addPage();
        doc.rect(0, 0, 595.28, 841.89).fill(BG);
        doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('03 // BIOLOGY & CONTINUITY', 40, 40, { characterSpacing: 2 });
        doc.fillColor(TEXT).fontSize(24).text('ROUTINES & METRICS', 40, 60);
        drawLine(100);

        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('ANCHORED SUBROUTINES (HABITS)', 40, 120, { characterSpacing: 1 });
        let hy = 145;
        if(habits.length > 0) {
            habits.slice(0, 8).forEach(h => {
                doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(h.name, 40, hy);
                doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(`${h.streak} Day Streak`, 40, hy + 15);
                drawProgressBar(200, hy + 5, 355, Math.min((h.streak / 66) * 100, 100), ACCENT);
                hy += 45;
            });
        } else {
            doc.fillColor(MUTED).fontSize(10).font('Helvetica-Oblique').text('No habit routines established.', 40, hy);
            hy += 45;
        }

        hy += 30;
        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('PHYSIOLOGICAL FUEL (NUTRITION & METRICS)', 40, hy, { characterSpacing: 1 });
        hy += 25;
        if (nutritionLogs.length > 0) {
            nutritionLogs.slice(0, 5).forEach((log) => {
                const dayCals = log.meals.reduce((acc, m) => acc + m.calories, 0);
                const dayProt = log.meals.reduce((acc, m) => acc + m.protein, 0);
                drawSurface(40, hy, 515, 45);
                doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(log.date || 'Unknown Date', 60, hy + 17);
                doc.fillColor(PRIMARY).fontSize(11).text(`${dayCals} KCAL  //  ${dayProt}G PROTEIN  //  ${log.waterIntake || 0}ML H2O`, 250, hy + 17);
                hy += 55;
            });
        } else {
            doc.fillColor(MUTED).fontSize(10).font('Helvetica-Oblique').text('No physiological logs recorded.', 40, hy);
        }

        // PAGE 5: FINANCIAL & SOCIAL LEDGER
        doc.addPage();
        doc.rect(0, 0, 595.28, 841.89).fill(BG);
        doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('04 // RESOURCES & SYNERGY', 40, 40, { characterSpacing: 2 });
        doc.fillColor(TEXT).fontSize(24).text('LEDGER & ALLIANCES', 40, 60);
        drawLine(100);

        // Finance
        const finY = 120;
        drawSurface(40, finY, 250, 90);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('CASH BALANCE', 60, finY + 20, { characterSpacing: 1 });
        doc.fillColor('#10b981').fontSize(24).font('Helvetica-Bold').text(`$${user.cashBalance?.toLocaleString() || 0}`, 60, finY + 45);

        drawSurface(305, finY, 250, 90);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('CREDIT BALANCE', 325, finY + 20, { characterSpacing: 1 });
        doc.fillColor(TEXT).fontSize(24).font('Helvetica-Bold').text(`$${user.creditBalance?.toLocaleString() || 0}`, 325, finY + 45);

        // Social
        let socY = finY + 110;
        doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('COLLABORATIVE SYNERGY METRICS', 40, socY, { characterSpacing: 1 });
        socY += 25;
        
        drawSurface(40, socY, 160, 90);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('SYNERGY POINTS', 55, socY + 20, { characterSpacing: 1 });
        doc.fillColor(PRIMARY).fontSize(24).font('Helvetica-Bold').text(`${user.socialStats?.synergyPoints || 0}`, 55, socY + 45);

        drawSurface(215, socY, 160, 90);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('ARENA VICTORIES', 230, socY + 20, { characterSpacing: 1 });
        doc.fillColor(TEXT).fontSize(24).font('Helvetica-Bold').text(`${user.socialStats?.battlesWon || 0}`, 230, socY + 45);

        drawSurface(390, socY, 165, 90);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('ORBS DISPATCHED', 405, socY + 20, { characterSpacing: 1 });
        doc.fillColor(TEXT).fontSize(24).font('Helvetica-Bold').text(`${user.socialStats?.orbsSent || 0}`, 405, socY + 45);

        // FOOTER (Apply perfectly to all pages)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.moveTo(40, 810).lineTo(555, 810).lineWidth(0.5).strokeColor(BORDER).strokeOpacity(1).stroke();
            doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold').text(`PROGRESS CIRCLE // NEURAL DATA ARCHIVE // ${i + 1} OF ${range.count}`, 40, 820, { align: 'center', characterSpacing: 2 });
        }

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        next(error);
    }
};

// @desc    Export user data to CSV for Data Science
// @route   GET /api/export/csv
// @access  Private (Premium Only)
exports.exportCSV = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({ userId }).lean();
        const habits = await Habit.find({ userId }).lean();
        const sessions = await Session.find({ userId }).lean();

        // Combine data for a comprehensive science export
        const combinedData = [
            ...tasks.map(t => ({ dataType: 'TASK', ...t })),
            ...habits.map(h => ({ dataType: 'HABIT', ...h })),
            ...sessions.map(s => ({ dataType: 'SESSION', ...s }))
        ];

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(combinedData);

        res.attachment(`Neural_Science_${req.user.name.replace(/\s+/g, '_')}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

// @desc    Export user data to JSON
// @route   GET /api/export/json
// @access  Private (Premium Only)
exports.exportJSON = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({ userId });
        const habits = await Habit.find({ userId });
        const sessions = await Session.find({ userId });

        const data = {
            user: { id: req.user.id, name: req.user.name, plan: req.user.plan },
            timestamp: new Date().toISOString(),
            dataset: {
                tasks,
                habits,
                sessions
            }
        };

        res.attachment(`Neural_Dataset_${req.user.name.replace(/\s+/g, '_')}.json`);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};
