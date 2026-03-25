import React, { useMemo } from 'react';
import { Target, CheckSquare, Plus, Activity, X } from 'lucide-react';

const TaskItem = React.memo(({ task, isSelected, onToggle, onToggleStatus, myTasks, isDelegated }) => {
    const isBig = task.isBigTask;
    const isCompleted = task.status === 'completed';
    const subTasks = useMemo(() => 
        myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id && isSelected),
    [myTasks, task._id, isSelected]);

    return (
        <div className="space-y-4">
            <div className={`hud-beveled-edge p-5 relative overflow-hidden font-inter ${
                isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50' 
                    : (isBig ? 'bg-[var(--primary)]/[0.08] border-[var(--primary)]/30' : 'bg-[var(--text)]/[0.02] border-[var(--border)]/10')
            }`}>
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-5 min-w-0">
                        <button
                            onClick={() => onToggleStatus(task._id)}
                            className={`w-8 h-8 flex items-center justify-center ${
                                isCompleted 
                                    ? 'bg-emerald-500 text-black' 
                                    : 'bg-[var(--text)]/5 border border-[var(--border)]/10 text-[var(--text)]/20'
                            }`}
                        >
                            <CheckSquare size={16} />
                        </button>
                        
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[12px] font-black uppercase tracking-widest truncate font-outfit ${
                                isCompleted ? 'text-[var(--text)]/20 line-through' : 'text-[var(--text)]/80'
                            }`}>
                                {task.title}
                            </span>
                            {isBig && (
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                                        <span className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Alpha Objective</span>
                                    </div>
                                    <span className="text-[8px] font-black text-[var(--text)]/20 uppercase tracking-widest">{subTasks.length} Sub-Nodes</span>
                                </div>
                            )}
                            {isDelegated && (
                                <span className="text-[8px] font-bold text-amber-500/90 uppercase tracking-wider mt-1">Assigned to you</span>
                            )}
                        </div>
                    </div>
                    
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-[var(--border)]/30'
                    }`} />
                </div>
            </div>

            {/* Sub-tasks with Hierarchical Indent */}
            {subTasks.length > 0 && (
                <div className="ml-8 space-y-3 border-l border-[var(--border)]/10 pl-6">
                    {subTasks.map(st => (
                        <div
                            key={st._id}
                            className="hud-beveled-edge p-3 bg-[var(--text)]/[0.01] border border-[var(--border)]/10 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <button
                                    onClick={() => onToggleStatus(st._id)}
                                    className={`w-5 h-5 flex items-center justify-center ${
                                        st.status === 'completed' ? 'text-emerald-500' : 'text-[var(--text)]/20'
                                    }`}
                                >
                                    <CheckSquare size={14} />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest truncate font-outfit ${
                                    st.status === 'completed' ? 'text-[var(--text)]/10 line-through' : 'text-[var(--text)]/40'
                                }`}>
                                    {st.title}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});


const TacticalSidebar = ({ 
    myTasks = [], 
    sessionStakedTasks = [],
    currentUserId,
    selectedTaskIds = [], 
    onToggleTaskStatus, 
    onOpenConfig,
    onClose,
    isHost = false,
    hasActiveBattle = false
}) => {
    const plannerMissions = useMemo(() => 
        myTasks.filter(t => selectedTaskIds.includes(t._id) && !t.parentId),
    [myTasks, selectedTaskIds]);

    const activeMissions = useMemo(() => {
        const plannerIds = new Set(plannerMissions.map((t) => String(t._id)));
        const delegated = (sessionStakedTasks || []).filter(
            (t) => t && !plannerIds.has(String(t._id))
        );
        return [...delegated, ...plannerMissions];
    }, [sessionStakedTasks, plannerMissions]);

    const totalProgress = useMemo(() => {
        if (activeMissions.length === 0) return 0;
        const completed = activeMissions.filter((t) => t.status === 'completed').length;
        return (completed / activeMissions.length) * 100;
    }, [activeMissions]);

    return (
        <aside className="lg:col-span-3 h-full flex flex-col bg-[var(--surface)] relative border-r border-[var(--border)]/10 overflow-hidden font-inter rounded-r-2xl">
            <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto pc-scrollbar relative z-10">
                <section className="space-y-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/12 flex items-center justify-center shrink-0">
                                <Target size={16} className="text-[var(--primary)]" />
                            </div>
                            <h3 className="text-[11px] font-bold text-[var(--text)]/70 uppercase tracking-[0.15em] font-outfit truncate">
                                Your tasks
                            </h3>
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)]/10 text-[var(--text)]/35 hover:text-[var(--text)] transition-colors shrink-0"
                                aria-label="Close panel"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {hasActiveBattle && (
                        <div
                            className={`rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
                                isHost
                                    ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/25 text-[var(--text)]/80'
                                    : 'bg-[var(--surface2)] border border-[var(--border)]/15 text-[var(--text)]/55'
                            }`}
                        >
                            {isHost ? (
                                <>
                                    In <span className="font-semibold text-[var(--text)]">Room scores</span>, use{' '}
                                    <span className="font-semibold text-[var(--primary)]">Assign</span> on a member’s row to delegate tasks; remove with <span className="font-semibold text-[var(--text)]">×</span> next to a task. This sidebar lists tasks you chose below plus anything in this session.
                                </>
                            ) : (
                                <>
                                    Session tasks for you appear here and under your name in <span className="font-semibold text-[var(--text)]/75">Room scores</span>. The host can use{' '}
                                    <span className="font-semibold text-[var(--primary)]">Assign</span> next to your name. This panel is your checklist.
                                </>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {activeMissions.length > 0 ? (
                            activeMissions.map(task => (
                                <TaskItem 
                                    key={task._id}
                                    task={task}
                                    isSelected={true}
                                    onToggleStatus={onToggleTaskStatus}
                                    myTasks={myTasks}
                                    isDelegated={
                                        !!currentUserId &&
                                        String(task.userId?._id || task.userId) !== String(currentUserId)
                                    }
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-[var(--border)]/20 bg-[var(--bg)]/40 text-center">
                                <Target size={22} className="text-[var(--text)]/15 mb-3" />
                                <p className="text-[12px] font-semibold text-[var(--text)]/55 mb-1">
                                    No tasks selected
                                </p>
                                <p className="text-[11px] text-[var(--text)]/40 leading-snug max-w-[14rem]">
                                    Choose tasks below to track them during this session.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="p-6 sm:p-8 border-t border-[var(--border)]/10 bg-[var(--surface2)]/50 mt-auto">
                <button
                    type="button"
                    onClick={onOpenConfig}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]/15 text-[var(--primary)] font-outfit font-semibold text-[11px] uppercase tracking-[0.12em] shadow-sm hover:bg-[var(--surface2)] transition-colors"
                >
                    <Plus size={16} />
                    <span>Choose tasks</span>
                </button>
            </div>
        </aside>
    );
};

export default React.memo(TacticalSidebar);
