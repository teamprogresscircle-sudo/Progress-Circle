import { useState, useEffect, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Flame, Trophy, Target, TrendingUp, Clock, CalendarDays, Brain, BellRing, Sparkles, Timer, PieChart, BarChart3, ArrowRight, Zap, Coffee, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { PriorityBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { WeeklyInsights } from '../components/WeeklyInsights';
import { ProgressCircle } from '../components/ProgressCircle';
import { AstraAssistant } from '../components/AstraAssistant';
import { toast } from 'sonner';
import { subscribeUserToPush } from '../utils/pushNotifications';
import dayjs from 'dayjs';
import { PageInsight } from '../components/PageInsight';

const QUOTES = [
    'Great work today!',
    'Consistency builds greatness.',
    'One more step forward.',
    'Small habits, extraordinary results.',
    'You\'re making progress every day.',
];


function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function getCountdown(deadline) {
    const now = dayjs();
    const then = dayjs(deadline);
    const diff = then.diff(now);
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    let timeStr = "";
    if (days > 0) timeStr = `${days} days ${hours} hours`;
    else if (hours > 0) timeStr = `${hours} hours ${minutes} minutes`;
    else timeStr = `${minutes} minutes`;

    if (diff <= 0) return `Overdue by ${timeStr}`;
    return timeStr;
}

export function Dashboard() {
    const { user } = useAuth();
    useSEO('Dashboard', 'Your productivity command center. See AI insights, task progress, and focus energy at a glance.');
    const {
        tasks, categories, leaderboard, sessions
    } = useData();
    const [pushPromptVisible, setPushPromptVisible] = useState(false);

    useEffect(() => {
        const checkPush = async () => {
            if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('push_dismissed')) {
                setPushPromptVisible(true);
            }
        };
        checkPush();
    }, []);

    const handleEnablePush = async () => {
        const sub = await subscribeUserToPush();
        if (sub) {
            toast.success('Smart notifications active! 🚀');
            setPushPromptVisible(false);
        } else {
            toast.error('Failed to enable notifications.');
        }
    };

    if (!tasks || !categories || !leaderboard || !sessions) return <LoadingSpinner />;

    // Stats & Insights - Use Sessions for real analytics
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Focus time: Only 'focus' sessions
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const totalTimeSpent = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const estimatedTimeRemaining = pendingTasks.reduce((acc, t) => acc + (t.estimatedTime || 0), 0);

    // Focus & Free Time Calculation
    const DAILY_BUDGET = 960; // 16h focus budget
    const todaySessions = sessions.filter(s => dayjs(s.startTime).isSame(dayjs(), 'day'));
    const focusToday = todaySessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + (s.duration || 0), 0);
    const spentToday = focusToday;
    const freeTimeToday = Math.max(0, DAILY_BUDGET - spentToday);

    // Productivity Predictions
    let prediction = { title: "On Track", desc: "Your workload fits within available time.", type: "success" };
    if (estimatedTimeRemaining > freeTimeToday) {
        prediction = { title: "Heavy Workload", desc: "Pending tasks might exceed your available free time today.", type: "warning" };
    } else if (pendingTasks.filter(t => !t.parentId).length > 5) {
        prediction = { title: "Busy Day Ahead", desc: "Focus on your high-priority tasks first to stay productive.", type: "info" };
    }

    // "Top Priority Nodes" - Strictly tasks ending within 48 hours
    const urgentTasks = tasks
        .filter(t => t.status !== 'completed' && t.deadline && dayjs(t.deadline).diff(dayjs(), 'hour') <= 48)
        .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)));

    // Activity Calculation
    const activities = useMemo(() => {
        const items = [];
        // Completed tasks today
        tasks.filter(t => t.status === 'completed' && dayjs(t.completedAt).isSame(dayjs(), 'day')).forEach(t => {
            items.push({
                title: 'Task Completed',
                description: t.title,
                timestamp: t.completedAt,
                type: 'success'
            });
        });
        // Sessions today
        sessions.filter(s => dayjs(s.startTime).isSame(dayjs(), 'day')).forEach(s => {
            items.push({
                title: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} Session`,
                description: `${s.classification} - ${s.duration} mins`,
                timestamp: s.startTime,
                type: 'info'
            });
        });
        return items.sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));
    }, [tasks, sessions]);

    const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    const nextDeadlineTask = tasks.filter(t => t.status !== 'completed' && t.deadline).sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))[0];

    const todaysTasks = urgentTasks.slice(0, 6);
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">
            {/* Push Notification Prompt */}
            {pushPromptVisible && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                >
                    <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-white rounded-2xl shadow-lg" style={{ boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}>
                                <BellRing size={20} className="animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Stay updated</h3>
                                <p className="text-[10px] text-pc-muted font-bold">Enable push notifications for real-time streak and habit alerts.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button 
                                onClick={handleEnablePush}
                                className="flex-1 sm:flex-none h-9 px-6 text-white border-none text-[10px] font-black uppercase tracking-widest"
                                style={{ background: 'var(--primary)' }}
                            >
                                Enable Push
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => { setPushPromptVisible(false); localStorage.setItem('push_dismissed', 'true'); }}
                                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest"
                            >
                                Later
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Header Section */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Premium System</span>
                        <span className="text-pc-muted text-[10px] font-black uppercase tracking-widest">•</span>
                        <span className="text-pc-muted text-[10px] font-black uppercase tracking-widest">{dayjs().format('MMMM D, YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="font-black pc-gradient-text page-title leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
                            {getGreeting()}, {user?.name || 'User'}
                        </h1>
                        <div className="mb-2">
                            <PageInsight 
                                title="Your Dashboard"
                                intro="Your central hub for tracking productivity, focus sessions, and growth."
                                operations={[
                                    { title: 'Daily Progress', content: 'Track your tasks and focus time in real-time.' },
                                    { title: 'Smart Insights', content: 'AI-powered suggestions to help you manage your time better.' },
                                    { title: 'Priority Tasks', content: 'Focus on what matters most with clear deadlines.' },
                                    { title: 'Activity Timeline', content: 'A history of everything you have accomplished today.' }
                                ]}
                                neuralTip="Try clearing small tasks early in the day to build momentum for deeper work later."
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-pc-muted">Current Streak</p>
                        <p className="text-lg font-black flex items-center gap-1 justify-end pc-streak-glow">{user?.streak || 0} <Flame size={16} className="text-orange-500" /></p>
                    </div>
                </div>
            </motion.div>

            {/* Today Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Main Progress Brain */}
                <Card id="tour-progress-brain" className="md:col-span-2 pc-card overflow-hidden group relative">
                    {/* Glowing background effect */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0">
                            <ProgressCircle progress={taskProgress} size={140} strokeWidth={12} color="var(--primary)">
                                <div className="text-center">
                                    <span className="text-2xl font-black block">{Math.round(taskProgress)}%</span>
                                    <span className="text-[10px] font-bold text-pc-muted uppercase tracking-widest">Done</span>
                                </div>
                            </ProgressCircle>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                    <Zap className="text-primary" size={24} />
                                </div>
                                <h2 className="text-lg font-black">Today Intelligence</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-pc-muted mb-1">Tasks Done</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black">{completedTasks.length}/{tasks.length}</span>
                                        <span className="text-[9px] font-bold text-green-500">+{tasks.filter(t => t.status === 'completed' && dayjs(t.completedAt).isSame(dayjs(), 'day')).length}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-pc-muted mb-1">Focus Energy</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black">{Math.floor(focusToday / 60)}h {focusToday % 60}m</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-pc-muted">Current Momentum</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= (taskProgress / 20) ? 'bg-primary animate-pulse' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Smart Time Suggestion */}
                <Card id="tour-smart-suggestion" className="flex flex-col justify-between border-l-4 border-l-primary bg-primary/5">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Smart Suggestion</h3>
                        </div>
                        <p className="font-bold text-sm leading-snug">
                            {estimatedTimeRemaining > freeTimeToday
                                ? "You have a heavy workload. Focus on high-priority items first."
                                : `You have ${Math.floor(freeTimeToday / 60)}h free today. Perfect for "Deep Work" on ${nextDeadlineTask?.title || 'your goals'}.`}
                        </p>
                    </div>

                    <Link to="/planner">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mt-4 hover:gap-3 transition-all">
                            View Planner <ArrowRight size={12} />
                        </button>
                    </Link>
                </Card>

                {/* Next Deadline Card */}
                <Card id="tour-next-critical" className={`flex flex-col justify-between ${nextDeadlineTask && dayjs(nextDeadlineTask.deadline).diff(dayjs(), 'hour') < 24 ? 'border-l-4 border-l-rose-500 bg-rose-500/5' : ''}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-pc-muted">
                            <Clock size={16} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Next Critical</h3>
                        </div>
                        {nextDeadlineTask ? (
                            <>
                                <p className="font-black text-lg line-clamp-1">{nextDeadlineTask.title}</p>
                                <p className={`text-xs font-bold mt-1 ${dayjs(nextDeadlineTask.deadline).diff(dayjs(), 'hour') < 24 ? 'text-rose-500' : 'text-pc-muted'}`}>
                                    {getCountdown(nextDeadlineTask.deadline)} left
                                </p>
                            </>
                        ) : (
                            <p className="text-xs font-bold text-pc-muted">All caught up!</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Intelligence & Activity */}
                <div className="lg:col-span-4 space-y-6">
                    <AstraAssistant />

                    <Card id="tour-activity-timeline" className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-primary" />
                                <h2 className="text-xs font-black uppercase tracking-widest">Activity Timeline</h2>
                            </div>
                        </div>
                        <ActivityTimeline activities={activities} />
                    </Card>

                    <Card className="bg-primary/10 border-primary/20 p-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Daily Mission</h3>
                        <div className="space-y-2">
                            {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(t => (
                                <div key={t.id} className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded border border-primary/30 flex-shrink-0" />
                                    <span className="text-[11px] font-bold truncate">{t.title}</span>
                                </div>
                            ))}
                            {tasks.filter(t => t.status !== 'completed').length > 3 && (
                                <p className="text-[9px] text-pc-muted italic">+{tasks.filter(t => t.status !== 'completed').length - 3} more pending</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column - Tasks & Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Weekly Performance */}
                    <Card id="tour-weekly-insights" className="p-4">
                        <WeeklyInsights tasks={tasks} sessions={sessions} />
                    </Card>

                    {/* Priority Tasks */}
                    <Card className="relative p-5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                                    <Target size={20} />
                                    <div className="absolute bottom-0 left-0 h-0.5 bg-primary/40 rounded-full transition-all group-hover:w-full" style={{ width: `${taskProgress}%` }} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-primary">{Math.round(taskProgress)}%</p>
                                    <p className="text-[10px] text-pc-muted font-medium">Critical items requiring immediate attention</p>
                                </div>
                            </div>
                            <Link to="/tasks">
                                <Button variant="ghost" className="h-8 px-3 text-[10px]">View All</Button>
                            </Link>
                        </div>

                        {todaysTasks.length === 0 ? (
                            <div className="py-6 flex items-center justify-center gap-6 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base">Perfectly Productive</h3>
                                    <p className="text-[10px] text-pc-muted mt-0.5 max-w-[180px]">All your priority tasks have been finished.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {todaysTasks.map(task => (
                                    <motion.div
                                        key={task.id || task._id}
                                        whileHover={{ y: -2 }}
                                        className={`p-4 rounded-2xl border bg-white/5 transition-all flex flex-col justify-between min-h-[100px] hover:border-indigo-500/30 group ${dayjs(task.deadline).diff(dayjs(), 'hour') < 12 ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                                <PriorityBadge priority={task.priority} />
                                            </div>
                                            {task.estimatedTime && (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-pc-muted uppercase tracking-widest">
                                                    <Timer size={10} /> {task.estimatedTime}m
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors uppercase tracking-tight">{task.title}</h4>
                                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-pc-muted">
                                            <CalendarDays size={10} /> {getCountdown(task.deadline)}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Insights Mini Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="flex items-center gap-4 border-l-4 border-l-primary bg-primary/5">
                            <div className="p-3 rounded-2xl bg-primary text-white shadow-lg" style={{ boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}>
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-pc-muted">Total Points</h3>
                                <p className="text-2xl font-black">{user?.points || 0}</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4 bg-gradient-to-br from-orange-500/10 to-transparent">
                            <div className="p-3 rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                                <Flame size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-pc-muted">Current Streak</h3>
                                <p className="text-2xl font-black">{user?.streak || 0} Days</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
