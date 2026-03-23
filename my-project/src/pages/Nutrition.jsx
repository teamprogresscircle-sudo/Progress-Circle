import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';

import { motion } from 'framer-motion';
import { 
    Salad, Plus, Droplets, Trash2, Clock, 
    Flame, Zap, Target, Coffee, Utensils,
    ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/client';
import { Confetti } from '../components/Confetti';
import { useTheme } from '../context/ThemeContext';
import { PageInsight } from '../components/PageInsight';

export function Nutrition() {
    const { dark } = useTheme();
    useSEO('Fuel & Nutrition Tracker', 'Log daily meals, track macros, and monitor hydration with the ProgressCircle nutrition engine.');
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [nutritionData, setNutritionData] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiVariant, setConfettiVariant] = useState('rain');
    const [showAddMeal, setShowAddMeal] = useState(false);
    const [newMeal, setNewMeal] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    const fetchNutrition = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/nutrition/${selectedDate}`);
            setNutritionData(res.data.data);
        } catch (error) {
            toast.error('Failed to sync neural fuel logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNutrition();
    }, [selectedDate]);

    const navigateDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const handleAddMeal = async (e) => {
        e.preventDefault();
        try {
            const mealToSubmit = {
                ...newMeal,
                calories: Number(newMeal.calories) || 0,
                protein: Number(newMeal.protein) || 0,
                carbs: Number(newMeal.carbs) || 0,
                fats: Number(newMeal.fats) || 0
            };
            const res = await api.post(`/nutrition/${selectedDate}/meal`, mealToSubmit);
            setNutritionData(res.data.data);
            setConfettiVariant('rain');
            setShowConfetti(true);
            setNewMeal({ name: '', calories: '', protein: '', carbs: '', fats: '', time: '12:00' });
            setShowAddMeal(false);
            toast.success('Fuel node integrated.');
        } catch (error) {
            toast.error('Failed to add meal.');
        }
    };

    const handleWaterUpdate = async (amount) => {
        try {
            const res = await api.put(`/nutrition/${selectedDate}/water`, { amount });
            setNutritionData(res.data.data);
            setConfettiVariant('rain');
            setShowConfetti(true);
            toast.success(`+${amount}ml Hydration synced.`);
        } catch (error) {
            toast.error('Water sync failed.');
        }
    };

    const handleDeleteMeal = async (mealId) => {
        try {
            const res = await api.delete(`/nutrition/${selectedDate}/meal/${mealId}`);
            setNutritionData(res.data.data);
            toast.success('Meal node removed from archive.');
        } catch (error) {
            toast.error('Delete failed.');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Scanning biological fuel signatures...</div>;

    const totals = nutritionData?.meals.reduce((acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fats: acc.fats + m.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const target = nutritionData?.dailyTargetCalories || 2000;
    const calProgress = Math.min((totals.calories / target) * 100, 100);

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            {/* Header section with Stats Card */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="pc-card relative overflow-hidden"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                            <div className="relative bg-surface border border-primary/30 p-3 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                                <Salad size={28} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-extrabold tracking-tight text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.75rem' }}>Fuel & Nutrition</h2>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                    <CalendarIcon size={14} className="text-primary" />
                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                {!isToday && (
                                    <button 
                                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                        className="text-[10px] uppercase font-black text-primary hover:text-white transition-colors tracking-widest bg-primary/10 px-2 py-1 rounded-md"
                                    >
                                        Return to Today
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:block ml-2">
                             <PageInsight 
                                title="Bio-Fuel Analytics"
                                intro="Regulate your internal chemistry through precise macronutrient monitoring. Optimize energy levels and body composition through data-driven dietary control."
                                operations={[
                                    { title: 'Nutrient Logging', content: 'Record daily caloric intake and macronutrient distribution (Protein, Carbs, Fats).' },
                                    { title: 'Target Calibration', content: 'Set and monitor specific nutritional goals based on your physical trajectory.' },
                                    { title: 'Consumption Analysis', content: 'Review real-time intake deltas against daily operational targets.' }
                                ]}
                                neuralTip="Consuming high-density protein within the 'Anabolic Window' post-exertion maximizes biological repair and hypertrophy efficiency."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
                            <button 
                                onClick={() => navigateDate(-1)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/80">
                                Time Drift
                            </div>
                            <button 
                                onClick={() => navigateDate(1)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowAddMeal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all text-white"
                            style={{ 
                                background: 'linear-gradient(135deg, var(--primary), rgba(var(--primary-rgb), 0.6))',
                                boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                            }}
                        >
                            <Plus size={16} /> Add Fuel
                        </button>
                    </div>
                </div>

                {/* Macro Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                                <Flame size={18} /> <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Calories</span>
                            </div>
                            <div className="text-3xl font-black text-white mb-1"><span className="text-primary">{totals.calories}</span><span className="text-sm text-white/40 font-bold ml-1">/ {target}</span></div>
                            <div className="h-2 bg-black/40 rounded-full mt-3 overflow-hidden shadow-inner flex">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(calProgress, 100)}%` }} className="h-full bg-primary relative">
                                    <div className="absolute inset-0 bg-white/30 truncate" style={{ animation: 'shimmer 2s infinite' }}></div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-white/5 border border-rose-500/20 hover:border-rose-500/40 transition-colors backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-rose-400">
                                <Zap size={18} /> <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Protein</span>
                            </div>
                            <div className="text-3xl font-black text-white">{totals.protein}<span className="text-sm font-bold text-rose-400/50 ml-1">g</span></div>
                            <p className="text-[10px] text-white/40 font-bold tracking-wide uppercase mt-2 border-t border-rose-500/20 pt-2">Muscle Synthesis</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                <Target size={18} /> <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Carbs</span>
                            </div>
                            <div className="text-3xl font-black text-white">{totals.carbs}<span className="text-sm font-bold text-emerald-400/50 ml-1">g</span></div>
                            <p className="text-[10px] text-white/40 font-bold tracking-wide uppercase mt-2 border-t border-emerald-500/20 pt-2">Cognitive Fuel</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-sky-500/20 hover:border-sky-500/40 transition-colors backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-sky-400">
                                <Droplets size={18} /> <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Hydration</span>
                            </div>
                            <div className="text-3xl font-black text-white">{(nutritionData?.waterIntake || 0) / 1000}<span className="text-sm font-bold text-sky-400/50 ml-1">L</span></div>
                            <p className="text-[10px] text-white/40 font-bold tracking-wide uppercase mt-2 border-t border-sky-500/20 pt-2">Neural Fluid</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Meal History */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="font-extrabold text-white flex items-center gap-2 tracking-tight text-lg"><Utensils size={18} className="text-primary" /> Meal Archive</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{nutritionData?.meals.length} entries detected</span>
                    </div>

                    {nutritionData?.meals.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl py-16 text-center flex flex-col items-center gap-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <Salad size={48} className="text-white/20" />
                            <p className="text-sm font-bold text-white/60 tracking-wide">No biological fuel nodes logged today.</p>
                            <button onClick={() => setShowAddMeal(true)} className="text-[11px] font-black text-primary tracking-widest uppercase hover:text-white transition-colors relative z-10 bg-primary/10 px-4 py-2 rounded-lg">Initialize Log</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {nutritionData?.meals.map((meal) => (
                                <motion.div 
                                    key={meal._id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/5 hover:border-white/15 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-primary shadow-inner">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-base tracking-tight">{meal.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-white/40 uppercase">{meal.time}</span>
                                                <span className="text-[10px] font-black text-primary px-2 py-0.5 rounded bg-primary/10">{meal.calories} KCAL</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase">
                                            <div className="bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-lg border border-rose-500/20">P: {meal.protein}g</div>
                                            <div className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">C: {meal.carbs}g</div>
                                            <div className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">F: {meal.fats}g</div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteMeal(meal._id)}
                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/40 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* Water Tracker Card */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20 relative overflow-hidden backdrop-blur-md">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div>
                                <h3 className="font-black text-white text-base flex items-center gap-2 tracking-tight"><Droplets size={18} className="text-sky-400" /> Hydration Sync</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400/70 mt-1">Target: 2000ml</p>
                            </div>
                            <span className="text-xl font-black text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">{((nutritionData?.waterIntake || 0) / 2000 * 100).toFixed(0)}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button onClick={() => handleWaterUpdate(250)} className="py-4 rounded-2xl bg-black/30 border border-sky-500/20 hover:border-sky-400/60 hover:bg-sky-500/20 transition-all group flex flex-col items-center justify-center shadow-inner">
                                <span className="text-sm font-black text-sky-400 group-hover:text-white transition-colors mb-1">+250ml</span>
                                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Glass</span>
                            </button>
                            <button onClick={() => handleWaterUpdate(500)} className="py-4 rounded-2xl bg-black/30 border border-sky-500/20 hover:border-sky-400/60 hover:bg-sky-500/20 transition-all group flex flex-col items-center justify-center shadow-inner">
                                <span className="text-sm font-black text-sky-400 group-hover:text-white transition-colors mb-1">+500ml</span>
                                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Bottle</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Insight Card */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <h3 className="font-black text-white text-base mb-3 flex items-center gap-2"><Coffee size={18} className="text-white/70" /> Dietary Analysis</h3>
                        <p className="text-xs leading-relaxed text-white/60 font-medium">
                            Neural signal optimization requires balanced macro distribution. Current focus fuel status is 
                            <span className="text-white font-bold">{totals.carbs > totals.protein * 2 ? ' biased towards fast carbs.' : ' optimally balanced.'}</span>
                        </p>
                        <button className="mt-5 text-[10px] w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-black tracking-widest uppercase transition-all shadow-inner">
                            View Deep Insights
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Adding Meal */}
            {showAddMeal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#111318] p-8 w-full max-w-md rounded-3xl relative overflow-hidden"
                        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {/* Glow effects behind modal */}
                        <div className="absolute -left-20 -top-20 w-40 h-40 bg-rose-500/10 blur-[50px] pointer-events-none"></div>
                        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-sky-500/10 blur-[50px] pointer-events-none"></div>

                        <h3 className="text-2xl font-black mb-8 text-white tracking-tight relative z-10">
                            Add Neural Fuel Node
                        </h3>
                        <form onSubmit={handleAddMeal} className="space-y-5 relative z-10">
                            <div>
                                <label className="text-[11px] font-black text-white/80 uppercase tracking-widest block mb-2">Meal Name</label>
                                <input 
                                    autoFocus
                                    required
                                    className="w-full bg-[#1A1D24] border border-sky-500/40 focus:border-sky-400 p-4 rounded-xl text-sm outline-none text-white transition-all placeholder:text-white/30"
                                    placeholder="e.g. Pre-Focus Protein Bowl"
                                    value={newMeal.name}
                                    onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-white/80 uppercase tracking-widest block mb-2">Calories</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-[#1A1D24] border border-white/10 focus:border-white/30 p-4 rounded-xl text-sm outline-none text-white transition-all placeholder:text-white/30"
                                        placeholder="0"
                                        value={newMeal.calories}
                                        onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-white/80 uppercase tracking-widest block mb-2">Time</label>
                                    <input 
                                        type="time"
                                        className="w-full bg-[#1A1D24] border border-white/10 focus:border-white/30 p-4 rounded-xl text-sm outline-none text-white transition-all"
                                        value={newMeal.time}
                                        onChange={e => setNewMeal({...newMeal, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest block mb-2">PROT (g)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-[#1A1D24] border border-rose-500/40 focus:border-rose-500 p-3 rounded-xl text-sm outline-none text-rose-400 transition-all placeholder:text-rose-500/30"
                                        placeholder="0"
                                        value={newMeal.protein}
                                        onChange={e => setNewMeal({...newMeal, protein: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-emerald-500 uppercase tracking-widest block mb-2">CARBS (g)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-[#1A1D24] border border-emerald-500/40 focus:border-emerald-500 p-3 rounded-xl text-sm outline-none text-emerald-400 transition-all placeholder:text-emerald-500/30"
                                        placeholder="0"
                                        value={newMeal.carbs}
                                        onChange={e => setNewMeal({...newMeal, carbs: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-amber-500 uppercase tracking-widest block mb-2">FATS (g)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-[#1A1D24] border border-amber-500/40 focus:border-amber-500 p-3 rounded-xl text-sm outline-none text-amber-400 transition-all placeholder:text-amber-500/30"
                                        placeholder="0"
                                        value={newMeal.fats}
                                        onChange={e => setNewMeal({...newMeal, fats: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-8 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddMeal(false)}
                                    className="flex-1 py-4 font-black text-sm text-white hover:text-white/70 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] py-4 bg-sky-500 rounded-2xl font-black text-sm text-white hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                                >
                                    Integrate Node
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <Confetti active={showConfetti} theme="nutrition" variant={confettiVariant} onComplete={() => setShowConfetti(false)} />
        </div>
    );
}
