import { useMemo } from 'react';
import { motion } from 'framer-motion';

export const TREES_PER_FARM = 36; // strictly 6x6 grid

const TILE_W = 96;
const TILE_H = 48;
const DIRT_DEPTH = 26;

// Dynamically assign fill order to start from the center (2.5, 2.5) and spiral outward organics
const FILL_ORDER = [];
for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
        FILL_ORDER.push([r, c]);
    }
}
FILL_ORDER.sort((a, b) => {
    const distA = Math.pow(a[0] - 2.5, 2) + Math.pow(a[1] - 2.5, 2);
    const distB = Math.pow(b[0] - 2.5, 2) + Math.pow(b[1] - 2.5, 2);
    return distA - distB;
});

const THEME_CONFIG = {
    classic: {
        sky: 'linear-gradient(135deg, #1e1b4b 0%, #0f0e2a 100%)',
        glow: '#818cf8',
        dirtLeft: '#854d0e',
        dirtRight: '#713f12',
        grassLight: '#a3e635',
        grassDark: '#84cc16',
        stroke: '#4d7c0f'
    },
    winter: {
        sky: 'linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)',
        glow: '#7dd3fc',
        dirtLeft: '#334155',
        dirtRight: '#1e293b',
        grassLight: '#f1f5f9',
        grassDark: '#e2e8f0',
        stroke: '#cbd5e1'
    },
    cyberpunk: {
        sky: 'linear-gradient(135deg, #2e1065 0%, #000000 100%)',
        glow: '#d946ef',
        dirtLeft: '#4a044e',
        dirtRight: '#2e1065',
        grassLight: '#1e1b4b',
        grassDark: '#0f172a',
        stroke: '#f0abfc'
    },
    desert: {
        sky: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
        glow: '#fb923c',
        dirtLeft: '#9a3412',
        dirtRight: '#7c2d12',
        grassLight: '#fde047',
        grassDark: '#eab308',
        stroke: '#854d0e'
    },
    newyork: {
        sky: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
        glow: '#f8fafc',
        dirtLeft: '#475569',
        dirtRight: '#334155',
        grassLight: '#94a3b8',
        grassDark: '#64748b',
        stroke: '#1e293b'
    },
    kyoto: {
        sky: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        glow: '#fdf2f8',
        dirtLeft: '#d1d5db',
        dirtRight: '#9ca3af',
        grassLight: '#fda4af',
        grassDark: '#fb7185',
        stroke: '#e11d48'
    },
    oasis: {
        sky: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
        glow: '#7dd3fc',
        dirtLeft: '#fcd34d',
        dirtRight: '#fbbf24',
        grassLight: '#4ade80',
        grassDark: '#22c55e',
        stroke: '#15803d'
    }
};

const EMOJI_MAPPING = {
    classic: {
        sapling: '1f331',
        pine: '1f332',
        oak: '1f333',
        pine_rare: '1f332',
        golden: '2728'
    },
    winter: {
        sapling: '2744',
        pine: '1f332',
        oak: '1f332',
        pine_rare: '2744',
        golden: '2728'
    },
    cyberpunk: {
        sapling: '26a1',
        pine: '1f4e1',
        oak: '1f5a5',
        pine_rare: '1f4e1',
        golden: '2728'
    },
    desert: {
        sapling: '1f335',
        pine: '1f335',
        oak: '1f334',
        pine_rare: '1f334',
        golden: '2728'
    },
    newyork: {
        sapling: '1f331',
        pine: '1f333',
        oak: '1f341',
        pine_rare: '1f342',
        golden: '2728'
    },
    kyoto: {
        sapling: '1f338',
        pine: '1f338',
        oak: '1f338',
        pine_rare: '1f3ef',
        golden: '1f3ee'
    },
    oasis: {
        sapling: '1f334',
        pine: '1f334',
        oak: '1f334',
        pine_rare: '1f3dd',
        golden: '2728'
    }
};

const TreeEmoji = ({ type, farmTheme }) => {
    const themeMap = EMOJI_MAPPING[farmTheme] || EMOJI_MAPPING.classic;
    const hex = themeMap[type] || themeMap.sapling;
    const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/svg/${hex}.svg`;

    const sizes = {
        sapling: 24,
        pine: 32,
        oak: 40,
        pine_rare: 45,
        golden: 50
    };

    const size = sizes[type] || 32;

    return (
        <foreignObject x={-size/2} y={-size - 2} width={size} height={size} style={{ pointerEvents: 'none' }}>
            <img 
                src={url} 
                alt={type} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    filter: type === 'golden' ? 'drop-shadow(0 0 5px rgba(251,191,36,0.6))' : 'none'
                }} 
            />
        </foreignObject>
    );
};

export function FarmScene({ trees, farmTheme = 'classic' }) {
    const GRID_SIZE = 6;
    const theme = THEME_CONFIG[farmTheme] || THEME_CONFIG.classic;

    const tiles = useMemo(() => {
        const arr = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const fillIndex = FILL_ORDER.findIndex(p => p[0] === row && p[1] === col);
                const tree = trees[fillIndex];
                const x = (col - row) * (TILE_W / 2);
                const y = (col + row) * (TILE_H / 2);
                const isLight = (row + col) % 2 === 0;
                arr.push({ row, col, x, y, tree, isLight, fillIndex });
            }
        }
        arr.sort((a, b) => (a.row + a.col) - (b.row + b.col));
        return arr;
    }, [trees]);

    const minX = -GRID_SIZE * (TILE_W / 2) - TILE_W + 20;
    const maxX = GRID_SIZE * (TILE_W / 2) + TILE_W - 20;
    const width = maxX - minX;
    const minY = -120;
    const maxY = (GRID_SIZE * 2) * (TILE_H / 2) + DIRT_DEPTH + TILE_H + 30;
    const height = maxY - minY;

    return (
        <div className="w-full relative rounded-2xl overflow-hidden shadow-xl" style={{ background: theme.sky }}>
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full opacity-30 blur-3xl pointer-events-none" 
                style={{ background: `radial-gradient(circle, ${theme.glow}, transparent)` }} 
            />

            <svg
                viewBox={`${minX} ${minY} ${width} ${height}`}
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '500px', margin: '0 auto', position: 'relative', zIndex: 1 }}
            >
                {tiles.map(tile => {
                    const topColor = tile.isLight ? theme.grassLight : theme.grassDark;
                    return (
                        <g key={`tile-${tile.row}-${tile.col}`} transform={`translate(${tile.x}, ${tile.y})`}>
                            <polygon
                                points={`0,${TILE_H / 2} ${TILE_W / 2},${TILE_H} ${TILE_W / 2},${TILE_H + DIRT_DEPTH} 0,${TILE_H / 2 + DIRT_DEPTH}`}
                                fill={theme.dirtLeft}
                            />
                            <polygon
                                points={`${TILE_W / 2},${TILE_H} ${TILE_W},${TILE_H / 2} ${TILE_W},${TILE_H / 2 + DIRT_DEPTH} ${TILE_W / 2},${TILE_H + DIRT_DEPTH}`}
                                fill={theme.dirtRight}
                            />
                            <polygon
                                points={`${TILE_W / 2},0 ${TILE_W},${TILE_H / 2} ${TILE_W / 2},${TILE_H} 0,${TILE_H / 2}`}
                                fill={topColor}
                                stroke={theme.stroke}
                                strokeWidth="0.75"
                            />

                            {tile.tree && (
                                <g transform={`translate(${TILE_W / 2}, ${TILE_H / 2})`}>
                                    <motion.g
                                        initial={{ opacity: 0, scale: 0, y: -20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: 'spring', damping: 10, mass: 0.8, delay: Math.min(tile.fillIndex * 0.05, 1.2) }}
                                    >
                                        <TreeEmoji type={tile.tree.type} farmTheme={farmTheme} />
                                    </motion.g>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
