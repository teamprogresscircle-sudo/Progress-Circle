import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal } from './Modal';
import { Plus } from 'lucide-react';

export function QuickAddModal({ open, onClose }) {
    const { addTask } = useData();

    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [isBigTask, setIsBigTask] = useState(false);
    const [priority, setPriority] = useState('medium');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addTask({ title, priority, deadline: date || null, isBigTask });

        // Reset
        setTitle('');
        setDate('');
        setIsBigTask(false);
        setPriority('medium');
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Quick Add">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Task Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="pc-input w-full text-lg font-bold"
                            placeholder="Type something..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Deadline</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pc-input w-full text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Priority</label>
                            <select className="pc-input w-full text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Standard</option>
                                <option value="high">Critical</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                        <div className={`w-12 h-6 rounded-full transition-all relative ${isBigTask ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isBigTask ? 'left-7' : 'left-1'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={isBigTask} onChange={(e) => setIsBigTask(e.target.checked)} />
                        <div className="flex-1">
                            <p className="text-xs font-black text-white uppercase tracking-widest">Main Task / Project</p>
                            <p className="text-[10px] text-muted">A parent for sub-tasks (e.g. Courses)</p>
                        </div>
                    </label>
                </div>

                <button type="submit" className="pc-btn pc-btn-primary w-full h-14 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform">
                    Add Task
                </button>
            </form>
        </Modal>
    );
}
