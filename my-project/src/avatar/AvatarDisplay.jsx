import { useMemo } from 'react';
import { generateAvatarSvg } from './avatarGenerator';
import { avatarDefaults } from './avatarDefaults';

const PET_EMOJIS = { pixelCat: '🐱', owl: '🦉', roboDog: '🤖', dragon: '🐉', fox: '🦊' };
const AURA_COLORS = { blueGlow: '#3b82f6', goldenFlame: '#f59e0b', purpleVoid: '#8b5cf6', matrixRain: '#10b981', emeraldPulse: '#059669' };

export function AvatarDisplay({ 
    avatarConfig, 
    size = 'md', 
    className = '', 
    showBg = true, 
    userTheme = null, 
    previewMode = false,
    showTitle = false,
    showPet = true
}) {
    // Merge provided config with defaults to ensure all keys exist
    const configToRender = { ...avatarDefaults, ...(avatarConfig || {}) };

    // Generate SVG string synchronously via DiceBear
    const svgString = useMemo(() => {
        return generateAvatarSvg(configToRender);
    }, [configToRender]);

    const sizeMap = { xs: 36, sm: 48, md: 72, lg: 90, xl: 120 };
    const px = sizeMap[size] ?? sizeMap.md;

    const getBackgroundStyle = () => {
        if (!showBg || !configToRender.backgroundColor || configToRender.backgroundColor === 'transparent') {
            return 'transparent';
        }
        
        const bg = configToRender.backgroundColor;
        // If it's a CSS gradient or already has a #, use it as is
        if (bg.includes('gradient') || bg.startsWith('#') || bg.startsWith('url')) {
            return bg;
        }
        // Otherwise assume it's a raw hex
        return `#${bg}`;
    };

    const glowColor = (configToRender.avatarAura && configToRender.avatarAura !== 'none') ? AURA_COLORS[configToRender.avatarAura] : null;

    return (
        <div className={`relative inline-flex flex-col items-center justify-center p-1 ${className}`}>
            {/* Title Badge - Only show if enabled and not "Novice" (unless in preview) */}
            {showTitle && configToRender.title && (configToRender.title !== 'Novice' || previewMode) && (
                <div 
                    className="absolute z-20 whitespace-nowrap px-2 py-0.5 rounded-full bg-indigo-500 text-white font-black uppercase tracking-tighter shadow-md border border-white/10 select-none pointer-events-none"
                    style={{ 
                        fontSize: `${Math.max(8, px * 0.12)}px`,
                        top: `-${px * 0.15}px`,
                        fontFamily: "'Manrope', sans-serif"
                    }}
                >
                    {configToRender.title}
                </div>
            )}

            <div
                className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative"
                style={{
                    width: px,
                    height: px,
                    background: getBackgroundStyle(),
                    boxShadow: glowColor ? `0 0 ${px * 0.4}px ${glowColor}, inset 0 0 ${px * 0.2}px ${glowColor}` : 'none',
                    transition: 'all 0.3s ease',
                    filter: configToRender.operationalMode === 'zen' ? 'sepia(0.2) hue-rotate(80deg) saturate(1.2)' :
                            configToRender.operationalMode === 'void' ? 'grayscale(0.8) contrast(1.2) brightness(0.8)' :
                            configToRender.operationalMode === 'overdrive' ? 'contrast(1.5) saturate(1.5) brightness(1.2)' : 'none'
                }}
            >
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgString }} />
                
                {/* Mode Overlays */}
                {configToRender.operationalMode === 'overdrive' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                        <div className="w-full h-full bg-[linear-gradient(rgba(255,0,0,0.1)_50%,transparent_50%)] bg-[length:100%_4px] animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
                    </div>
                )}
                {configToRender.operationalMode === 'zen' && (
                    <div className="absolute inset-0 pointer-events-none bg-emerald-400/10 mix-blend-soft-light" />
                )}
                {configToRender.operationalMode === 'void' && (
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(139,92,246,0.3)]" />
                )}
            </div>
            {configToRender.companionPet && configToRender.companionPet !== 'none' && PET_EMOJIS[configToRender.companionPet] && showPet && (
                <div 
                    className="absolute z-10 drop-shadow-lg flex items-center justify-center pointer-events-none animate-bounce"
                    style={{ 
                        bottom: size === 'xs' || size === 'sm' ? `-${px * 0.02}px` : `-${px * 0.1}px`, 
                        right: size === 'xs' || size === 'sm' ? `-${px * 0.02}px` : `-${px * 0.1}px`,
                        fontSize: size === 'xs' || size === 'sm' ? `${px * 0.32}px` : `${px * 0.28}px`,
                        animationDuration: '3s'
                    }}
                >
                    {PET_EMOJIS[configToRender.companionPet]}
                </div>
            )}
        </div>
    );
}
