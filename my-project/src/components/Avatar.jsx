export function Avatar({ src, name = '', size = 'md' }) {
    const sizes = { sm: 32, md: 40, lg: 56, xl: 80 };
    const px = sizes[size] || 40;
    const fontSize = px * 0.35;
    const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    const baseStyle = {
        width: px, height: px,
        borderRadius: '50%',
        flexShrink: 0,
        border: '2px solid #c7d2fe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    };

    if (src) {
        return <img src={src} alt={name} style={{ ...baseStyle, objectFit: 'cover' }} />;
    }

    return (
        <div style={{
            ...baseStyle,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff',
            fontSize,
            fontWeight: 700,
        }}>
            {initials}
        </div>
    );
}
