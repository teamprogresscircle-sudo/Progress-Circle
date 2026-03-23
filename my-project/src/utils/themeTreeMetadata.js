export const THEME_TREE_METADATA = {
    classic: {
        sapling: { name: 'Sapling', icon: '🌱' },
        pine: { name: 'Pine', icon: '🌲' },
        oak: { name: 'Oak', icon: '🌳' },
        pine_rare: { name: 'Rare Pine', icon: '🌲' },
        golden: { name: 'Golden Tree', icon: '✨' }
    },
    winter: {
        sapling: { name: 'Snowflake', icon: '❄️' },
        pine: { name: 'Frozen Pine', icon: '🌲' },
        oak: { name: 'Ice Tree', icon: '🌳' },
        pine_rare: { name: 'Blue Crystal', icon: '💎' },
        golden: { name: 'Golden Frost', icon: '✨' }
    },
    cyberpunk: {
        sapling: { name: 'Static', icon: '⚡' },
        pine: { name: 'Antenna', icon: '📡' },
        oak: { name: 'Mainframe', icon: '🖥️' },
        pine_rare: { name: 'Super Server', icon: '⚡' },
        golden: { name: 'Diamond Node', icon: '💎' }
    },
    desert: {
        sapling: { name: 'Sprout', icon: '🌵' },
        pine: { name: 'Cactus', icon: '🌵' },
        oak: { name: 'Palm', icon: '🌴' },
        pine_rare: { name: 'Yucca', icon: '🌴' },
        golden: { name: 'Golden Cactus', icon: '✨' }
    },
    newyork: {
        sapling: { name: 'Sprout', icon: '🌱' },
        pine: { name: 'London Plane', icon: '🌳' },
        oak: { name: 'Maple', icon: '🍁' },
        pine_rare: { name: 'Autumn Maple', icon: '🍂' },
        golden: { name: 'Liberty Tree', icon: '🗽' }
    },
    kyoto: {
        sapling: { name: 'Sakura Bud', icon: '🌸' },
        pine: { name: 'Petal', icon: '🌸' },
        oak: { name: 'Blossom', icon: '🌸' },
        pine_rare: { name: 'Castle', icon: '🏯' },
        golden: { name: 'Lantern', icon: '🏮' }
    },
    oasis: {
        sapling: { name: 'Palm Sprout', icon: '🌴' },
        pine: { name: 'Fan Palm', icon: '🌴' },
        oak: { name: 'Date Palm', icon: '🌴' },
        pine_rare: { name: 'Desert Island', icon: '🏝️' },
        golden: { name: 'Oasis Star', icon: '✨' }
    }
};

export const getTreeMetadata = (theme, type) => {
    const themeData = THEME_TREE_METADATA[theme] || THEME_TREE_METADATA.classic;
    return themeData[type] || THEME_TREE_METADATA.classic[type];
};
