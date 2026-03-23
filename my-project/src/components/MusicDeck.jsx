import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Music2, ExternalLink, Link2, Play, Info, Layers } from 'lucide-react';
import { Card } from './Card';
import { toast } from 'sonner';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const PLATFORMS = [
    { id: 'spotify', name: 'Spotify', icon: Music, color: '#1DB954' },
    { id: 'anghami', name: 'Anghami', icon: Music2, color: '#ed1c24' },
    { id: 'apple', name: 'Apple Music', icon: Music2, color: '#fc3c44' },
];

const PRESETS = {
    spotify: [
        { name: 'Lofi Study', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0Ex7X' },
        { name: 'Deep Focus', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKzbUnY3Yv' },
        { name: 'Synthwave', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN6aqFS3m' },
    ],
    anghami: [
        { name: 'Focus Flow', url: 'https://widget.anghami.com/playlist/125345719/' },
        { name: 'Acoustic Morning', url: 'https://widget.anghami.com/playlist/125345722/' },
    ],
    apple: [
        { name: 'Pure Focus', url: 'https://embed.music.apple.com/us/playlist/pure-focus/pl.606e3089d8924683a54d6ca4c6792f3a' },
        { name: 'Beat Study', url: 'https://embed.music.apple.com/us/playlist/beat-study/pl.80dee00c6d994366bdb03704bb49b4c0' },
    ]
};

export function MusicDeck() {
    const [platform, setPlatform] = useState('spotify');
    const [customUrl, setCustomUrl] = useState('');
    const [activeUrl, setActiveUrl] = useState(PRESETS.spotify[0].url);
    const { user } = useAuth();

    const [isResolving, setIsResolving] = useState(false);

    // Auto-load from profile on mount
    useEffect(() => {
        if (user?.musicPreferences?.platform && user?.musicPreferences?.playlistUrl) {
            resolveAndLoad(user.musicPreferences.playlistUrl, user.musicPreferences.platform);
        }
    }, [user]); // Added user to dependency array to re-run if user data changes

    const resolveAndLoad = async (url, targetPlatform = null) => {
        let trimmed = url.trim();
        if (!trimmed) return false;

        setIsResolving(true);
        try {
            // Check if it's a short link that needs resolution
            // Supported short domains: open.anghami.com, spotify.link, amzn.to (placeholder)
            if (trimmed.includes('open.anghami.com') || trimmed.includes('spotify.link') || (trimmed.includes('music.apple.com') && !trimmed.match(/\/(playlist|album|song)\//))) {
                const res = await api.get(`/integration/resolve-url?url=${encodeURIComponent(trimmed)}`);
                if (res.data.success) {
                    trimmed = res.data.data.resolvedUrl;
                }
            }

            let embedUrl = null;
            let identifiedPlatform = targetPlatform;

            // 1. Check Spotify
            const spotifyMatch = trimmed.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?(playlist|track|album)\/([a-zA-Z0-9]+)/);
            if (spotifyMatch) {
                identifiedPlatform = 'spotify';
                embedUrl = `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
            } 
            
            // 2. Check Apple Music
            const appleMatch = trimmed.match(/music\.apple\.com\/([a-z]{2})\/(playlist|album|song)\/(?:[^/]+\/)?([a-zA-Z0-9.\-]+)/);
            if (appleMatch && !embedUrl) {
                identifiedPlatform = 'apple';
                embedUrl = `https://embed.music.apple.com/${appleMatch[1]}/${appleMatch[2]}/${appleMatch[3]}`;
            }

            // 3. Check Anghami
            // Match play.anghami.com/playlist/ID or open.anghami.com redirects
            // IDs should be alphanumeric; verified working pattern: widget.anghami.com/playlist/ID/
            const anghamiMatch = trimmed.match(/anghami\.com\/(?:[a-z]{2}\/)?(playlist|song|album|artist)\/([a-zA-Z0-9]+)/);
            if (anghamiMatch && !embedUrl) {
                identifiedPlatform = 'anghami';
                const type = anghamiMatch[1];
                const id = anghamiMatch[2].trim();
                embedUrl = `https://widget.anghami.com/${type}/${id}/`;
            }

            // 4. Fallback for already correct embed URLs
            if (!embedUrl) {
                const cleanTrimmed = trimmed.trim();
                if (cleanTrimmed.includes('spotify.com/embed')) { identifiedPlatform = 'spotify'; embedUrl = cleanTrimmed; }
                else if (cleanTrimmed.includes('embed.music.apple.com')) { identifiedPlatform = 'apple'; embedUrl = cleanTrimmed; }
                else if (cleanTrimmed.includes('anghami.com/')) { identifiedPlatform = 'anghami'; embedUrl = cleanTrimmed; }
            }

            if (embedUrl) {
                setPlatform(identifiedPlatform);
                setActiveUrl(embedUrl);
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        } finally {
            setIsResolving(false);
        }
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        const success = await resolveAndLoad(customUrl);
        if (success) {
            setCustomUrl('');
            toast.success(`Broadcasting radio...`, {
                description: 'Signal strength 100%. Enjoy your session.',
                duration: 3000
            });
        } else {
            toast.error('Codec Error', {
                description: "We couldn't decode this link. Please use a direct playlist or song URL.",
                duration: 4000
            });
        }
    };

    return (
        <Card className="p-0 overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">
            {/* Header / Tabs */}
            <div className="flex border-b border-white/5">
                {PLATFORMS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => {
                            setPlatform(p.id);
                            setActiveUrl(PRESETS[p.id][0].url);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            platform === p.id 
                                ? 'bg-white/[0.05] text-white' 
                                : 'text-pc-muted hover:text-white hover:bg-white/[0.02]'
                        }`}
                        style={{ borderBottom: platform === p.id ? `2px solid ${p.color}` : '2px solid transparent' }}
                    >
                        <p.icon size={14} style={{ color: platform === p.id ? p.color : 'inherit' }} />
                        <span className="hidden sm:inline">{p.name}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4">
                {/* Embedded Player */}
                <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                    <iframe
                        title="Music Player"
                        src={activeUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="absolute inset-0"
                    />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                    {PRESETS[platform]?.map((preset) => (
                        <button
                            key={preset.url}
                            onClick={() => setActiveUrl(preset.url)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                                activeUrl === preset.url
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white/5 border-transparent text-pc-muted hover:bg-white/10'
                            }`}
                        >
                            {preset.name}
                        </button>
                    ))}
                    {user?.musicPreferences?.playlistUrl && (
                        <button
                            onClick={() => resolveAndLoad(user.musicPreferences.playlistUrl, user.musicPreferences.platform)}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                        >
                            Sync Profile Radio
                        </button>
                    )}
                </div>

                {/* Custom URL Input */}
                <form onSubmit={handleCustomSubmit} className="relative">
                    <input
                        type="text"
                        placeholder="Paste Spotify/Anghami/Apple link..."
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-all pr-10"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-muted hover:text-white transition-colors">
                        <Play size={14} />
                    </button>
                </form>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-pc-muted uppercase tracking-widest font-black opacity-50">
                        <Info size={10} />
                        Audio deck optimized for deep work
                    </div>
                    
                    {user?.linkedAccounts?.[platform] ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[8px] font-black uppercase text-green-500">Account Linked</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[8px] font-black uppercase text-amber-500">Preview Mode</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
