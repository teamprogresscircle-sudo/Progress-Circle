export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    loading = false,
    ...props
}) {
    const variantClass = {
        primary: 'pc-btn-primary',
        secondary: 'pc-btn-secondary',
        ghost: 'pc-btn-ghost',
        danger: 'pc-btn-danger',
    }[variant] || 'pc-btn-primary';

    const sizeClass = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
    }[size] || 'text-sm px-4 py-2';

    return (
        <button
            className={`pc-btn ${variantClass} ${sizeClass} ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
            )}
            {children}
        </button>
    );
}