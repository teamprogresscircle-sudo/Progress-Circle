import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useData } from '../context/DataContext';
import { Check, Clock, Calendar, Swords, Zap } from 'lucide-react';

export function SquadConfigModal({ open, onClose, onConfirm }) {
    const { tasks } = useData();
    const [duration, setDuration] = useState(25);
    const [isMultiday, setIsMultiday] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);

    const toggleTask = (taskId) => {
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleConfirm = () => {
        onConfirm({
            duration,
            isMultiday,
            tasks: selectedTasks
        });
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Configure Squad Protocol" maxWidth="max-w-xl">
            <div className="space-y-6 py-2">
                {/* Duration Picker */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Temporal Duration
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setIsMultiday(false)}
                            className={`p-4 rounded-2xl border transition-all text-left ${!isMultiday ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-white/5 border-white/5'}`}
                        >
                            <p className="font-bold text-white text-sm">Tactical Sprint</p>
                            <div className="flex items-center gap-2 mt-2">
                                <input 
                                    type="number" 
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="bg-black/20 border-none rounded-lg w-16 px-2 py-1 text-xs font-bold"
                                />
                                <span className="text-[10px] text-muted font-black uppercase">mins</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setIsMultiday(true)}
                            className={`p-4 rounded-2xl border transition-all text-left ${isMultiday ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-white/5 border-white/5'}`}
                        >
                            <p className="font-bold text-white text-sm">Strategic Siege</p>
                            <div className="flex items-center gap-2 mt-2 text-indigo-400">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase">Persistent Mode</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Task Selection */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                        <Swords size={12} /> Staked Missions <span className="text-indigo-500">({selectedTasks.length})</span>
                    </h4>
                    <div className="max-h-60 overflow-y-auto pc-scrollbar space-y-2 pr-2">
                        {tasks.filter(t => t.status !== 'completed').map((task) => (
                            <button 
                                key={task._id}
                                onClick={() => toggleTask(task._id)}
                                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                                    selectedTasks.includes(task._id) 
                                    ? 'bg-indigo-500/10 border-indigo-500/40' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}
                            >
                                <span className="font-bold text-xs truncate max-w-[80%]">{task.title}</span>
                                {selectedTasks.includes(task._id) && <Check size={14} className="text-indigo-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        icon={Zap} 
                        className="w-full h-14 bg-indigo-500 shadow-lg shadow-indigo-500/20"
                        onClick={handleConfirm}
                    >
                        DEPLOY SQUAD FOCUS
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
