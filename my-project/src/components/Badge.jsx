const PRIORITY_STYLES = {
    high: { label: 'High', bg: '#fee2e2', color: '#dc2626' },
    medium: { label: 'Medium', bg: '#ffedd5', color: '#ea580c' },
    low: { label: 'Low', bg: '#dcfce7', color: '#16a34a' },
};
const STATUS_STYLES = {
    pending: { label: 'Pending', bg: '#f3f4f6', color: '#6b7280' },
    in_progress: { label: 'In Progress', bg: '#dbeafe', color: '#2563eb' },
    completed: { label: 'Completed', bg: '#dcfce7', color: '#16a34a' },
    active: { label: 'Active', bg: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' },
    paused: { label: 'Paused', bg: '#fef9c3', color: '#ca8a04' },
};

const pillStyle = (bg, color) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: '9999px',
    fontSize: '12px', fontWeight: 600,
    background: bg, color,
});

export function PriorityBadge({ priority }) {
    const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
    return <span style={pillStyle(s.bg, s.color)}>{s.label}</span>;
}

export function StatusBadge({ status }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return <span style={pillStyle(s.bg, s.color)}>{s.label}</span>;
}
