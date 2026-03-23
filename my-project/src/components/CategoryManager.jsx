import { useState } from 'react';
import { Pencil, Trash2, Tag } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal } from './Modal';
import { Button } from './Button';
import { toast } from 'sonner';

const COLORS = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'
];

export function CategoryManager({ open, onClose }) {
    const { categories, addCategory, updateCategory, deleteCategory } = useData();
    const [editCat, setEditCat] = useState(null);
    const [form, setForm] = useState({ name: '', color: COLORS[0], icon: 'Tag' });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Name is required');
        setSaving(true);
        try {
            if (editCat) {
                await updateCategory(editCat.id, form);
                toast.success('Category updated');
            } else {
                await addCategory(form);
                toast.success('Category created');
            }
            setEditCat(null);
            setForm({ name: '', color: COLORS[0], icon: 'Tag' });
        } catch (error) {
            toast.error('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (cat) => {
        setEditCat(cat);
        setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    };

    const handleDelete = (id) => {
        setConfirmDelete(id);
    };

    const confirmDeleteCategory = async () => {
        if (!confirmDelete) return;
        try {
            await deleteCategory(confirmDelete);
            toast.success('Category deleted');
            setConfirmDelete(null);
        } catch (error) {
            toast.error('Failed to delete category');
            setConfirmDelete(null);
        }
    };

    return (
        <>
        <Modal open={open} onClose={onClose} title="Manage Categories">
            <div className="space-y-6">
                {/* Form */}
                <div className="pc-card bg-muted/10 space-y-3 p-4">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">
                        {editCat ? 'Edit Category' : 'New Category'}
                    </p>
                    <div className="flex gap-2">
                        <input
                            className="pc-input flex-1"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="University, Gym, Projects..."
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setForm({ ...form, color: c })}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'scale-110 border-indigo-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1" size="sm" onClick={handleSave} loading={saving}>
                            {editCat ? 'Update' : 'Add Category'}
                        </Button>
                        {editCat && (
                            <Button variant="secondary" size="sm" onClick={() => { setEditCat(null); setForm({ name: '', color: COLORS[0], icon: 'Tag' }); }}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {categories.length === 0 ? (
                        <div className="text-center py-8">
                            <Tag className="mx-auto text-muted mb-2 opacity-20" size={32} />
                            <p className="text-xs text-muted">No custom categories yet</p>
                        </div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50 group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                    <span className="text-sm font-semibold">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-muted hover:text-indigo-500 transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-muted hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>

        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Category?">
            <div className="space-y-4">
                <p className="text-sm text-muted">Are you sure you want to delete this category? Tasks using it will lose their category.</p>
                <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-center flex items-center justify-center gap-2">⚠️ This action cannot be undone.</p>
                <div className="flex gap-3 pt-2">
                    <button className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm" onClick={confirmDeleteCategory}>Delete Category</button>
                    <button className="flex-1 py-3 px-4 rounded-xl font-bold bg-muted/10 text-white hover:bg-muted/20 transition-all border border-border" onClick={() => setConfirmDelete(null)}>Cancel</button>
                </div>
            </div>
        </Modal>
        </>
    );
}
