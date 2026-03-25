import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckSquare, Plus, Activity, X } from 'lucide-react';

const TaskItem = React.memo(({ task, isSelected, onToggle, onToggleStatus, myTasks }) => {
    const isBig = task.isBigTask;
    const isCompleted = task.status === 'completed';
    const subTasks = useMemo(() => 
        myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id && isSelected),
    [myTasks, task._id, isSelected]);

    return (
        <div className="space-y-3">
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group p-4 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-200 ${
                    isBig 
                        ? 'bg-[var(--primary)]/[0.04] border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]' 
                        : 'bg-[var(--surface)] border border-[var(--border)]/10 hover:border-[var(--primary)]/30'
                }`}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onToggleStatus(task._id)}
                            className={`flex-shrink-0 p-2.5 rounded-xl transition-all ${
                                isCompleted
                                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-[var(--text)]/5 text-[var(--text)]/10 hover:text-emerald-400'
                            }`}
                        >
                            <CheckSquare size={18} />
                        </motion.button>
                        
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[13px] font-bold truncate tracking-tight transition-all ${
                                isCompleted ? 'text-[var(--text)]/20 line-through' : 'text-[var(--text)]'
                            }`}>
                                {task.title}
                            </span>
                            {isBig && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="px-1.5 py-0.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[7px] font-black text-[var(--primary)] uppercase">Epic Mission</div>
                                    <span className="text-[8px] font-bold text-[var(--text)]/20 uppercase tracking-widest">{subTasks.length} Sub-Objectives</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : (isBig ? 'bg-[var(--primary)] animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-[var(--text)]/10')
                    }`} />
                </div>
            </motion.div>

            {/* Sub-tasks with Hierarchical indent */}
            {subTasks.length > 0 && (
                <div className="ml-6 space-y-2.5 border-l border-[var(--border)]/10 pl-5">
                    {subTasks.map(st => (
                        <motion.div
                            key={st._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3.5 rounded-xl bg-[var(--text)]/[0.01] border border-[var(--border)]/10 flex items-center justify-between gap-4 group/sub"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => onToggleStatus(st._id)}
                                    className={`p-1.5 rounded-lg transition-all ${
                                        st.status === 'completed' ? 'text-emerald-500' : 'text-[var(--text)]/10 hover:text-[var(--text)]/40'
                                    }`}
                                >
                                    <CheckSquare size={15} />
                                </button>
                                <span className={`text-[11px] font-semibold truncate ${
                                    st.status === 'completed' ? 'text-[var(--text)]/20 line-through' : 'text-[var(--text)]/60'
                                }`}>
                                    {st.title}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
});

const TacticalSidebar = ({ 
    myTasks = [], 
    selectedTaskIds = [], 
    onToggleTaskStatus, 
    onOpenConfig,
    onClose 
}) => {
    const activeMissions = useMemo(() => 
        myTasks.filter(t => selectedTaskIds.includes(t._id) && !t.parentId),
    [myTasks, selectedTaskIds]);

    const totalProgress = useMemo(() => {
        if (selectedTaskIds.length === 0) return 0;
        const completed = myTasks.filter(t => selectedTaskIds.includes(t._id) && t.status === 'completed').length;
        return (completed / selectedTaskIds.length) * 100;
    }, [myTasks, selectedTaskIds]);

    return (
        <aside className="lg:col-span-3 border-r border-[var(--border)]/10 p-8 flex flex-col h-full bg-[var(--bg)] relative overflow-hidden">
            {/* Ambient Tonal Background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="flex-1 space-y-10 overflow-y-auto pc-scrollbar pr-2 relative z-10">
                {/* Session Loadout Header */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Target size={14} className="text-[var(--primary)]" /> Mission Loadout
                        </h3>
                        {onClose && (
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-[var(--text)]/20 hover:text-[var(--primary)] transition-colors"
                            >
                                <X size={14} />
                            </motion.button>
                        )}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="h-1 w-full bg-[var(--text)]/[0.03] rounded-full overflow-hidden border border-[var(--border)]/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${totalProgress}%` }}
                            className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]" 
                        />
                    </div>

                    {/* Mission List */}
                    <div className="space-y-4 pt-4">
                        {activeMissions.length > 0 ? (
                            activeMissions.map(task => (
                                <TaskItem 
                                    key={task._id}
                                    task={task}
                                    isSelected={true}
                                    onToggleStatus={onToggleTaskStatus}
                                    myTasks={myTasks}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-[var(--border)]/10 bg-[var(--text)]/[0.015] grayscale opacity-40">
                                <Target size={32} className="text-[var(--text)]/20 mb-4" />
                                <p className="text-[10px] font-black text-center text-[var(--text)]/40 uppercase tracking-[0.2em] leading-relaxed">
                                    No Directives Loaded<br/>Standby for Assignment
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-8 border-t border-[var(--border)]/10 mt-auto">
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenConfig}
                    className="w-full flex items-center justify-center gap-4 py-5 rounded-[1.5rem] bg-[var(--surface)] border border-[var(--border)]/10 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 text-[var(--text)]/40 hover:text-[var(--primary)] transition-all group shadow-xl"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em]">Configure Loadout</span>
                </motion.button>
            </div>
        </aside>
    );
};

export default React.memo(TacticalSidebar);
