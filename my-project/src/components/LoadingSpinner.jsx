export function LoadingSpinner({ size = 'md', center = true }) {
    const s = { sm: '20px', md: '32px', lg: '48px' }[size] || '32px';
    const spinner = (
        <div style={{
            width: s, height: s,
            borderRadius: '50%',
            border: '4px solid #c7d2fe',
            borderTopColor: '#6366f1',
            animation: 'spin 0.75s linear infinite',
        }} />
    );
    if (!center) return spinner;
    return (
        <div className="flex items-center justify-center py-16">
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {spinner}
        </div>
    );
}
