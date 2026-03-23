/**
 * Individual User League System
 * League is determined by the user's `points` (task/habit completions).
 * Score is a separate broader metric used for leaderboard ranking.
 */

export const LEAGUES = [
    {
        id: 'Master',
        label: 'Master',
        emoji: '👑',
        min: 500000,
        color: '#f59e0b',
        textClass: 'text-amber-400',
        bgClass: 'from-amber-400/20 to-amber-900/10',
        borderClass: 'border-amber-400/40',
        shadowClass: 'shadow-amber-500/30',
        description: 'The pinnacle of productivity mastery.',
    },
    {
        id: 'Diamond',
        label: 'Diamond',
        emoji: '💎',
        min: 100000,
        color: '#22d3ee',
        textClass: 'text-cyan-400',
        bgClass: 'from-cyan-400/20 to-cyan-900/10',
        borderClass: 'border-cyan-400/40',
        shadowClass: 'shadow-cyan-500/30',
        description: 'Elite operator. Exceptional consistency.',
    },
    {
        id: 'Platinum',
        label: 'Platinum',
        emoji: '⚡',
        min: 25000,
        color: '#818cf8',
        textClass: 'text-indigo-400',
        bgClass: 'from-indigo-400/20 to-indigo-900/10',
        borderClass: 'border-indigo-400/40',
        shadowClass: 'shadow-indigo-500/30',
        description: 'Advanced productivity specialist.',
    },
    {
        id: 'Gold',
        label: 'Gold',
        emoji: '🏆',
        min: 5000,
        color: '#eab308',
        textClass: 'text-yellow-400',
        bgClass: 'from-yellow-400/20 to-yellow-900/10',
        borderClass: 'border-yellow-400/40',
        shadowClass: 'shadow-yellow-500/30',
        description: 'High-performing achiever.',
    },
    {
        id: 'Silver',
        label: 'Silver',
        emoji: '🥈',
        min: 1000,
        color: '#94a3b8',
        textClass: 'text-slate-300',
        bgClass: 'from-slate-400/20 to-slate-800/10',
        borderClass: 'border-slate-300/40',
        shadowClass: 'shadow-slate-500/20',
        description: 'Consistent contributor on the rise.',
    },
    {
        id: 'Bronze',
        label: 'Bronze',
        emoji: '🥉',
        min: 0,
        color: '#f97316',
        textClass: 'text-orange-400',
        bgClass: 'from-orange-500/20 to-orange-900/10',
        borderClass: 'border-orange-400/40',
        shadowClass: 'shadow-orange-500/20',
        description: 'Starting the journey. Keep going!',
    },
];

/**
 * Returns the league object for a given points value.
 * @param {number} points
 * @returns {object} League definition
 */
export function getLeague(points = 0) {
    return LEAGUES.find((l) => points >= l.min) || LEAGUES[LEAGUES.length - 1];
}

/**
 * Returns the next league above the current one, or null if already Master.
 * @param {number} points
 * @returns {object|null}
 */
export function getNextLeague(points = 0) {
    const current = getLeague(points);
    const idx = LEAGUES.findIndex((l) => l.id === current.id);
    return idx > 0 ? LEAGUES[idx - 1] : null;
}

/**
 * Returns progress (0-1) toward the next league.
 * @param {number} points
 * @returns {number}
 */
export function getLeagueProgress(points = 0) {
    const current = getLeague(points);
    const next = getNextLeague(points);
    if (!next) return 1; // Already at max
    const range = next.min - current.min;
    const gained = points - current.min;
    return Math.min(gained / range, 1);
}
