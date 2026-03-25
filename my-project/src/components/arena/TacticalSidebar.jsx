import React, { useMemo } from 'react';
import { Target, CheckSquare, Plus, Activity, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TaskItem = React.memo(({ task, isSelected, onToggle, onToggleStatus, myTasks }) => {
    const isBig = task.isBigTask;
    const isCompleted = task.status === 'completed';
    const subTasks = useMemo(() => 
        myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id && isSelected),
    [myTasks, task._id, isSelected]);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
        >
            <motion.div
                whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.06)' }}
                whileTap={{ scale: 0.98 }}
                className={`group relative p-5 rounded-[2rem_0.5rem_2rem_0.5rem] border transition-all duration-300 ${
                    isBig 
                        ? 'bg-[var(--primary)]/[0.08] border-[var(--primary)]/30 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)]' 
                        : 'bg-white/[0.03] border-white/5 hover:border-[var(--primary)]/30'
                }`}
            >
                {/* Tactical Accent Line */}
                <div className={`absolute top-0 left-0 w-1 h-12 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[var(--primary)]'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5 min-w-0">
                        <button
                            onClick={() => onToggleStatus(task._id)}
                            className={`flex-shrink-0 p-3 rounded-xl transition-all active:scale-90 ${
                                isCompleted
                                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-white/5 text-white/10 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                        >
                            <CheckSquare size={18} />
                        </button>
                        
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[13px] font-black uppercase tracking-tight transition-all ${
                                isCompleted ? 'text-white/20 line-through' : 'text-white/90'
                            }`}>
                                {task.title}
                            </span>
                            {isBig && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="px-2 py-0.5 rounded bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">Elite Objective</div>
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{subTasks.length} Nodes</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : (isBig ? 'bg-[var(--primary)] animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10')
                    }`} />
                </div>
            </motion.div>

            {/* Sub-tasks with Hierarchical indent */}
            {subTasks.length > 0 && (
                <div className="ml-8 space-y-3 border-l-2 border-white/5 pl-6">
                    {subTasks.map(st => (
                        <motion.div
                            key={st._id}
                            whileHover={{ x: 4 }}
                            className="p-4 rounded-[1.5rem_0.4rem_1.5rem_0.4rem] bg-white/[0.015] border border-white/5 flex items-center justify-between gap-4 group/sub transition-all hover:border-[var(--primary)]/20"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <button
                                    onClick={() => onToggleStatus(st._id)}
                                    className={`p-2 rounded-lg transition-all active:scale-90 ${
                                        st.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-white/10 hover:text-emerald-400'
                                    }`}
                                >
                                    <CheckSquare size={15} />
                                </button>
                                <span className={`text-[11px] font-black uppercase tracking-wide truncate ${
                                    st.status === 'completed' ? 'text-white/10 line-through' : 'text-white/40'
                                }`}>
                                    {st.title}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
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
        <aside className="lg:col-span-3 h-full flex flex-col bg-[#0b0f1a] relative border-r border-white/5 overflow-hidden">
            {/* Ambient Tonal Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="flex-1 p-10 space-y-12 overflow-y-auto pc-scrollbar relative z-10">
                {/* Session Loadout Header */}
                <section className="space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] flex items-center gap-3">
                                <Target size={14} /> Tactical Loadout
                            </h3>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-6">Objective Synchronized</p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white hover:border-[var(--primary)]/30 transition-all active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Overall Progress Tracker */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30 px-1">
                            <span>Efficiency Level</span>
                            <span className="text-[var(--primary)]">{Math.round(totalProgress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${totalProgress}%` }}
                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" 
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Mission List */}
                    <div className="space-y-6">
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
                            <div className="flex flex-col items-center justify-center py-20 px-8 rounded-[3rem_0.5rem_3rem_0.5rem] border border-dashed border-white/10 bg-white/[0.01] opacity-60">
                                <Target size={32} className="text-white/10 mb-5" />
                                <p className="text-[10px] font-black text-center text-white/20 uppercase tracking-[0.3em] leading-relaxed">
                                    No Directives Loaded<br/>Standby for Assignment
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-8 border-t border-white/5 bg-[#0b0f1a]/80 backdrop-blur-xl mt-auto">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenConfig}
                    className="group relative w-full flex items-center justify-center gap-5 py-6 rounded-[2rem_0.5rem_2rem_0.5rem] bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:border-[var(--primary)]/50 text-[var(--primary)] transition-all shadow-xl shadow-[var(--primary)]/5"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-700" />
                    <span className="text-[12px] font-black uppercase tracking-[0.3em]">Configure Array</span>
                </motion.button>
            </div>
        </aside>
    );
};

export default React.memo(TacticalSidebar);
