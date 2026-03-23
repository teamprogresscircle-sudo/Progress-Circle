export function ProgressBar({ progress = 0, color = 'indigo', showLabel = false, size = 'md' }) {
    const clamp = Math.min(100, Math.max(0, progress));

    const gradients = {
        indigo: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
        green: 'linear-gradient(90deg,#22c55e,#16a34a)',
        orange: 'linear-gradient(90deg,#f97316,#f59e0b)',
        sky: 'linear-gradient(90deg,#38bdf8,#6366f1)',
        red: 'linear-gradient(90deg,#ef4444,#dc2626)',
    };

    const heights = { sm: '6px', md: '10px', lg: '16px' };
    const h = heights[size] || '10px';

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    <span>Progress</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{clamp}%</span>
                </div>
            )}
            <div style={{ width: '100%', height: h, borderRadius: '9999px', background: 'var(--surface2)', overflow: 'hidden' }}>
                <div style={{
                    height: h,
                    width: `${clamp}%`,
                    borderRadius: '9999px',
                    background: gradients[color] || gradients.indigo,
                    transition: 'width 0.8s ease',
                }} />
            </div>
        </div>
    );
}