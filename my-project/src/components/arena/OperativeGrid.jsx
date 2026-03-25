import React, { useMemo } from 'react';
import { BarChart3, Users, UserPlus, X } from 'lucide-react';

const OperativeGrid = ({
    members,
    currentUserId,
    pointsPop,
    scoreOverrideByUser = {},
    isHost = false,
    hasActiveBattle = false,
    battleParticipants = [],
    onAssignToMember,
    onUnassignTask
}) => {
    const scoredMembers = useMemo(() => {
        const normalized = (members || []).map((member) => {
            const memberId = String(member.user?._id || member.user?.id || member.user || member._id);
            const overrideScore = scoreOverrideByUser[memberId];
            const score = Number(
                overrideScore ??
                member.user?.totalScore ??
                member.totalPoints ??
                0
            ) || 0;

            return {
                id: memberId,
                name: member.user?.name || member.name || 'Member',
                score
            };
        });

        return normalized.sort((a, b) => b.score - a.score);
    }, [members, scoreOverrideByUser]);

    const nameByUserId = useMemo(() => {
        const m = {};
        (members || []).forEach((mem) => {
            const id = String(mem.user?._id || mem.user?.id || mem.user || mem._id);
            if (id) m[id] = mem.user?.name || mem.name || 'Member';
        });
        return m;
    }, [members]);

    const tasksByAssigneeId = useMemo(() => {
        const map = {};
        (battleParticipants || []).forEach((p) => {
            const uid = String(p.user?._id || p.user?.id || p.user);
            if (!uid) return;
            map[uid] = Array.isArray(p.battleTasks) ? p.battleTasks.filter(Boolean) : [];
        });
        return map;
    }, [battleParticipants]);

    const stakedCountByUser = useMemo(() => {
        const out = {};
        Object.keys(tasksByAssigneeId).forEach((uid) => {
            out[uid] = tasksByAssigneeId[uid].length;
        });
        return out;
    }, [tasksByAssigneeId]);

    const maxScore = useMemo(
        () => Math.max(1, ...scoredMembers.map((member) => member.score)),
        [scoredMembers]
    );

    const canUseAssign = typeof onAssignToMember === 'function';
    const canUnassign = isHost && typeof onUnassignTask === 'function';

    /** Only host sees Assign on other members' rows — no button on your own row */
    const showAssignOnMember = (member) => {
        if (!hasActiveBattle || !canUseAssign) return false;
        const isMe = String(member.id) === String(currentUserId);
        if (isMe) return false;
        return isHost;
    };

    const taskTitle = (task) => {
        if (!task) return 'Task';
        if (typeof task === 'string') return 'Task';
        return task.title || 'Task';
    };

    const ownerLabel = (task, assigneeId) => {
        if (!task || typeof task === 'string') return null;
        const ownerId = String(task.userId?._id || task.userId || '');
        if (!ownerId || ownerId === assigneeId) return null;
        const ownerName = task.userId?.name || nameByUserId[ownerId] || 'Member';
        return ownerName;
    };

    return (
        <div className="w-full max-w-none px-1 sm:px-2 mt-auto">
            <section className="rounded-2xl sm:rounded-3xl bg-[var(--surface)]/90 border border-[var(--border)]/15 p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5 sm:mb-6">
                    <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                        <BarChart3 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-bold text-[var(--text)] uppercase tracking-wide font-outfit">
                            Room scores
                        </h3>
                        <p className="text-[11px] text-[var(--text)]/45 font-inter mt-0.5 leading-snug">
                            Total score (profile) for everyone in this room.
                            {hasActiveBattle && isHost && (
                                <span className="text-[var(--text)]/55">
                                    {' '}
                                    Use <span className="font-semibold text-[var(--text)]/70">Assign</span> on a member’s row to give them tasks or delegate yours. You can remove assignments below.
                                </span>
                            )}
                            {hasActiveBattle && !isHost && (
                                <span className="text-[var(--text)]/55">
                                    {' '}
                                    Session tasks for you are listed under your name. The host can assign work with <span className="font-semibold text-[var(--text)]/70">Assign</span>.
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {scoredMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-[var(--border)]/20 bg-[var(--bg)]/30">
                        <Users size={28} className="text-[var(--text)]/15 mb-2" />
                        <p className="text-[12px] font-medium text-[var(--text)]/45">No members to show yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scoredMembers.map((member) => {
                            const width = Math.max(6, (member.score / maxScore) * 100);
                            const isMe = String(member.id) === String(currentUserId);
                            const staked = stakedCountByUser[member.id] ?? 0;
                            const showAssignBtn = showAssignOnMember(member);
                            const sessionTasks = tasksByAssigneeId[member.id] || [];
                            return (
                                <div
                                    key={member.id}
                                    className="relative rounded-xl border border-[var(--border)]/10 bg-[var(--bg)]/20 p-3 sm:p-3.5"
                                >
                                    <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[12px] font-semibold text-[var(--text)]/90 truncate">
                                                    {member.name}
                                                    {isMe && (
                                                        <span className="ml-1.5 text-[10px] font-medium text-[var(--primary)]">(you)</span>
                                                    )}
                                                </span>
                                                {showAssignBtn && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onAssignToMember(member.id)}
                                                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/12 border border-[var(--primary)]/25 text-[var(--primary)] text-[11px] font-semibold hover:bg-[var(--primary)]/20 transition-colors"
                                                        title={`Assign tasks for ${member.name}`}
                                                    >
                                                        <UserPlus size={14} />
                                                        Assign
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                                <div className="h-2.5 sm:h-3 rounded-full bg-[var(--surface2)] border border-[var(--border)]/20 overflow-hidden min-w-0">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)]/80 to-[var(--primary)] transition-[width] duration-500 ease-out"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                                <span className="text-[12px] font-bold text-[var(--text)]/70 tabular-nums shrink-0">
                                                    {member.score}
                                                </span>
                                            </div>
                                            {hasActiveBattle && staked > 0 && (
                                                <p className="text-[10px] text-[var(--text)]/40 font-inter">
                                                    {staked} task{staked === 1 ? '' : 's'} in this session
                                                </p>
                                            )}
                                            {hasActiveBattle && sessionTasks.length > 0 && (
                                                <ul className="mt-2 space-y-1.5 border-t border-[var(--border)]/10 pt-2">
                                                    {sessionTasks.map((task) => {
                                                        const tid = String(task?._id || task);
                                                        const title = taskTitle(task);
                                                        const from = ownerLabel(task, member.id);
                                                        return (
                                                            <li
                                                                key={tid}
                                                                className="flex items-start justify-between gap-2 text-[11px] text-[var(--text)]/75 font-inter leading-snug"
                                                            >
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="font-medium text-[var(--text)]/85">{title}</span>
                                                                    {from && (
                                                                        <span className="text-[var(--text)]/45">
                                                                            {' '}
                                                                            (from {from})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {canUnassign && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onUnassignTask(tid, member.id)}
                                                                        className="shrink-0 p-1 rounded-md text-[var(--text)]/35 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                        title="Remove from session"
                                                                        aria-label="Remove from session"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    {isMe && pointsPop?.show && (
                                        <span className="absolute -top-1 right-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            +{pointsPop.points} XP
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default React.memo(OperativeGrid);
