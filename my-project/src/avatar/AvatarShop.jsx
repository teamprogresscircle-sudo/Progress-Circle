import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useGamification } from '../context/GamificationContext';
import { AvatarDisplay } from './AvatarDisplay';
import { avatarOptions } from './avatarOptions';
import { avatarDefaults } from './avatarDefaults';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FarmScene } from '../components/FarmScene';

const CATEGORIES = [
    { key: 'head', label: 'Hair / Head', icon: '💇' },
    { key: 'face', label: 'Face', icon: '😀' },
    { key: 'facialHair', label: 'Facial Hair', icon: '🧔' },
    { key: 'clothingColor', label: 'Clothing Col.', icon: '👕' },
    { key: 'accessories', label: 'Accessories', icon: '🕶️' },
    { key: 'skinColor', label: 'Skin Tone', icon: '🎨' },
    { key: 'headContrastColor', label: 'Hair Color', icon: '🖌️' },
    { key: 'backgroundColor', label: 'Background', icon: '🌅' },
    { key: 'farmTheme', label: 'Farm Themes', icon: '🚜' },
    { key: 'title', label: 'Titles', icon: '🏷️' },
    { key: 'operationalMode', label: 'Protocols', icon: '📡' },
    { key: 'avatarAura', label: 'Auras', icon: '🌟' },
    { key: 'companionPet', label: 'Pets', icon: '🐾' }
];

const FARM_THEME_PREVIEWS = {
    classic: { bg: '#a3e635', icon: '🌿' },
    winter: { bg: '#e0f2fe', icon: '❄️' },
    cyberpunk: { bg: '#1e1b4b', icon: '⚡' },
    desert: { bg: '#fef3c7', icon: '🌵' },
    newyork: { bg: '#94a3b8', icon: '🏙️' },
    kyoto: { bg: '#fecdd3', icon: '🌸' },
    oasis: { bg: '#7dd3fc', icon: '🌴' }
};

const PET_PREVIEWS = {
    none: '❌', pixelCat: '🐱', owl: '🦉', roboDog: '🤖', dragon: '🐉', fox: '🦊'
};
const TRACK_PREVIEWS = {
    none: '❌'
};
const PROTOCOL_PREVIEWS = {
    none: '🌐', zen: '🧘', overdrive: '⚡', void: '🌌'
};
const AURA_PREVIEWS = {
    none: 'transparent', blueGlow: '#3b82f6', goldenFlame: '#f59e0b', purpleVoid: '#8b5cf6', matrixRain: '#10b981', emeraldPulse: '#059669'
};

export function AvatarShop() {
    const { gamData, loading, saveAvatar, buyItem } = useGamification();
    const [activeTab, setActiveTab] = useState('head');
    const [previewConfig, setPreviewConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [buying, setBuying] = useState(null);



    // Initialize preview with current saved avatar or defaults
    useEffect(() => {
        if (gamData && gamData.avatarConfig && !previewConfig) {
            const cleanConfig = { ...avatarDefaults };
            const shopItems = gamData.shopItems || {};

            for (const key of Object.keys(avatarDefaults)) {
                const userVal = gamData.avatarConfig[key];
                if (userVal !== undefined) {
                    if (key === 'seed') {
                        cleanConfig[key] = userVal;
                    } else if (shopItems[key]) {
                        const isValid = shopItems[key].some(item => item.val === userVal);
                        if (isValid) {
                            cleanConfig[key] = userVal;
                        }
                    }
                }
            }
            setPreviewConfig(cleanConfig);
        } else if (gamData && !previewConfig) {
            setPreviewConfig({ ...avatarDefaults, seed: gamData.username || 'default' });
        }
    }, [gamData, previewConfig]);

    if (loading || !gamData || !previewConfig) return <LoadingSpinner />;

    const liveConfig = { ...previewConfig };

    function handlePreview(key, value) {
        setPreviewConfig(prev => ({ ...prev, [key]: value }));
    }

    async function handleEquip(key, value) {
        if (saving) return;
        setSaving(true);
        const newConfig = { ...previewConfig, [key]: value };
        setPreviewConfig(newConfig);

        try {
            await saveAvatar(newConfig);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Auto-save failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await saveAvatar(liveConfig);
            toast.success('✅ Avatar saved!');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to save avatar');
        } finally {
            setSaving(false);
        }
    }

    // Check if the current preview differs from saved config to show the Save button
    const hasChanges = JSON.stringify(gamData.avatarConfig || {}) !== JSON.stringify(previewConfig);

    const items = gamData.shopItems?.[activeTab] || [];
    const inventory = gamData.inventory || [];

    async function handleBuy(itemId, price) {
        if (buying) return;
        setBuying(itemId);
        try {
            await buyItem(itemId);
            toast.success(`🛍️ Item purchased! -${price} pts`);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Purchase failed');
        } finally {
            setBuying(null);
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold pc-gradient-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>
                        Avatar Editor
                    </h1>
                    <p className="text-xs text-muted mt-1">Customize your Open Peeps avatar.</p>
                </div>
            </div>

            {/* Avatar live preview */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl min-h-[220px] justify-center" style={{ background: 'var(--color-surface-2)' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'farmTheme' ? (
                        <motion.div
                            key="farm-preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md"
                        >
                            <FarmScene
                                farmTheme={liveConfig.farmTheme}
                                trees={[
                                    { type: 'oak' }, { type: 'pine' }, { type: 'sapling' },
                                    { type: 'pine_rare' }, { type: 'golden' }, { type: 'pine' }
                                ]}
                            />
                            <p className="text-center text-[10px] text-muted mt-2 uppercase tracking-widest font-bold">Farm Theme Preview</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="avatar-preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}>
                                <AvatarDisplay avatarConfig={liveConfig} size="xl" previewMode={true} showTitle={true} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Auto-save on equip is active, manual save button is no longer needed */}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveTab(cat.key)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                        style={{
                            background: activeTab === cat.key ? 'var(--primary)' : 'var(--color-surface-2)',
                            color: activeTab === cat.key ? 'white' : 'var(--color-text-muted)',
                        }}
                    >
                        <span>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Options grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))' }}
                >
                    {items.map((item, i) => {
                        const optValue = item.val;
                        const isPreviewing = previewConfig[activeTab] === optValue;
                        const isSaved = gamData.avatarConfig?.[activeTab] === optValue;
                        const isOwned = item.price === 0 || inventory.includes(item.id);

                        // Create a temporary config to preview this single option
                        const previewOptConfig = { ...previewConfig, [activeTab]: optValue };

                        return (
                            <motion.div
                                key={`${item.id}`}
                                whileHover={{ y: -2 }}
                                onClick={() => handlePreview(activeTab, optValue)}
                                className="relative flex flex-col items-center p-2.5 rounded-2xl cursor-pointer transition-all"
                                style={{
                                    background: isPreviewing ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--color-surface-2)',
                                    border: isPreviewing ? '2px solid var(--primary)' : '2px solid transparent',
                                    opacity: isOwned ? 1 : 0.9,
                                }}
                            >
                                {/* Preview / Icon Section */}
                                <div className="h-10 flex items-center justify-center mb-1.5">
                                    {activeTab === 'farmTheme' ? (
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                                            style={{ background: FARM_THEME_PREVIEWS[optValue]?.bg || 'var(--color-surface-3)' }}
                                        >
                                            {FARM_THEME_PREVIEWS[optValue]?.icon || '❓'}
                                        </div>
                                    ) : activeTab === 'companionPet' ? (
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-black/20">
                                            {PET_PREVIEWS[optValue] || '❓'}
                                        </div>
                                    ) : activeTab === 'operationalMode' ? (
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-black/20">
                                            {PROTOCOL_PREVIEWS[optValue] || '❓'}
                                        </div>
                                    ) : activeTab === 'avatarAura' ? (
                                        <div
                                            className="w-10 h-10 rounded-full border border-white/10"
                                            style={{ boxShadow: optValue !== 'none' ? `0 0 15px ${AURA_PREVIEWS[optValue]}` : 'none', background: 'var(--color-surface-3)' }}
                                        />
                                    ) : item.badge ? (
                                        <div className="w-10 h-10 rounded-md flex items-center justify-center text-[10px] font-black uppercase text-indigo-300 bg-black/20">
                                            {item.badge}
                                        </div>
                                    ) : (activeTab === 'skinColor' || activeTab === 'headContrastColor' || activeTab === 'clothingColor' || activeTab === 'backgroundColor') ? (
                                        <div
                                            className="w-10 h-10 rounded-full border-2 border-white/10"
                                            style={{
                                                background: (optValue === 'transparent' || optValue.includes('gradient'))
                                                    ? optValue
                                                    : `#${optValue}`
                                            }}
                                        />
                                    ) : (
                                        <AvatarDisplay avatarConfig={previewOptConfig} size="sm" showBg={false} />
                                    )}
                                </div>

                                {/* Text Info Section */}
                                <div className="flex-1 flex flex-col items-center justify-start text-center mb-2">
                                    <p className="text-[10px] font-bold line-clamp-2 w-full leading-tight" style={{ color: 'var(--color-text)' }}>
                                        {item.name}
                                    </p>
                                    {item.desc && (
                                        <p className="text-[8px] text-muted-foreground leading-tight px-1 mt-1 opacity-70 line-clamp-3">
                                            {item.desc}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons Container */}
                                <div className="flex flex-col gap-1 w-full mt-auto">
                                    <button
                                            onClick={(e) => { e.stopPropagation(); handlePreview(activeTab, optValue); }}
                                            className={`text-[9px] font-semibold px-2 py-1 rounded-lg border transition-all ${!isPreviewing ? 'border-white/10 hover:border-white/30 text-muted' : 'text-white shadow-sm'}`}
                                            style={isPreviewing ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                                        >
                                            Preview
                                        </button>

                                    {isSaved ? (
                                        <div className="h-6 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                                                <Check size={10} /> Saved
                                            </span>
                                        </div>
                                    ) : isOwned ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEquip(activeTab, optValue); }}
                                            className="text-[9px] font-semibold h-6 rounded-lg text-white shadow-sm"
                                            style={{ background: 'var(--primary)' }}
                                        >
                                            Equip
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleBuy(item.id, item.price); }}
                                            disabled={buying === item.id || gamData.points < item.price}
                                            className="text-[9px] font-bold h-6 rounded-lg text-white disabled:opacity-50 shadow-sm"
                                            style={{ background: gamData.points >= item.price ? 'var(--primary)' : '#6b7280' }}
                                        >
                                            {buying === item.id ? '...' : `${item.price} pts`}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
