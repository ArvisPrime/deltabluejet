import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { useCurrency } from '../../hooks/useCurrency';
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategoryMeta,
    type AncillaryProduct,
    type AncillaryCategory,
} from '../../services/ancillaryService';
import { downloadCSV, printTable } from '../../utils/tableExport';

const EMPTY: Omit<AncillaryProduct, 'id'> = {
    name: '', description: '', category: 'baggage',
    price: 0, currency: 'USD', available: true,
};

const AncillaryAdmin: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const { display } = useCurrency();
    const [products, setProducts] = useState<AncillaryProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try { setProducts(await getAllProducts()); }
        catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        if (!form.name || form.price <= 0) { addToast('Name and price required', 'warning'); return; }
        setSaving(true);
        try {
            await createProduct(form);
            addToast('Product created', 'success');
            setShowForm(false); setForm(EMPTY);
            await load();
        } catch { addToast('Failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (p: AncillaryProduct) => {
        await updateProduct(p.id, { available: !p.available });
        addToast(`${p.name} ${p.available ? 'disabled' : 'enabled'}`, 'success');
        await load();
    };

    const handleDelete = async (p: AncillaryProduct) => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        await deleteProduct(p.id);
        addToast('Deleted', 'success');
        await load();
    };

    // ── Export Handlers ─────────────────────────────────────
    const handleExportCSV = () => {
        const rows = products.map(p => ({
            'Name': p.name,
            'Category': getCategoryMeta(p.category).label,
            'Price (USD)': (p.price / 100).toFixed(2),
            'Status': p.available ? 'Active' : 'Disabled',
            'Description': p.description || '',
        }));
        downloadCSV(rows, 'ancillary_products');
        addToast(`Exported ${rows.length} products`, 'success');
    };

    const handlePrint = () => {
        const tableRows = products.map(p => {
            const meta = getCategoryMeta(p.category);
            return `<tr>
                <td><strong>${p.name}</strong></td>
                <td>${meta.label}</td>
                <td>$${(p.price / 100).toFixed(2)}</td>
                <td><span class="badge badge-${p.available ? 'active' : 'inactive'}">${p.available ? 'Active' : 'Disabled'}</span></td>
                <td style="max-width:250px;font-size:10px;color:#6b7280">${p.description || '\u2014'}</td>
            </tr>`;
        }).join('');

        printTable('Ancillary Products', `
            <table>
                <thead><tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Description</th>
                </tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div style="margin-top:12px;font-size:10px;color:#6b7280;">
                Total: ${products.length} products \u2022 ${products.filter(p => p.available).length} active
            </div>
        `);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    const cats: AncillaryCategory[] = ['baggage', 'meal', 'lounge', 'priority', 'wifi', 'insurance'];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Ancillary Products</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">Manage add-on products for passenger bookings</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-3 bg-navy-50 text-navy-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-100 transition-all flex items-center gap-2"
                        title="Print to PDF"
                    >
                        <span className="material-symbols-outlined text-lg">print</span> Print
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-3 bg-navy-50 text-navy-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-100 transition-all flex items-center gap-2"
                        title="Download CSV"
                    >
                        <span className="material-symbols-outlined text-lg">download</span> CSV
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span> Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cats.slice(0, 4).map(cat => {
                    const meta = getCategoryMeta(cat);
                    const count = products.filter(p => p.category === cat).length;
                    return (
                        <div key={cat} className="p-6 bg-white rounded-[2rem] border border-navy-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                                    <span className="material-symbols-outlined">{meta.icon}</span>
                                </div>
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{meta.label}</span>
                            </div>
                            <p className="text-3xl font-black text-navy-950 tracking-tighter">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* New Product Form */}
            {showForm && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-6">
                    <h3 className="text-sm font-black text-navy-950 uppercase">New Product</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <input placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 focus:ring-2 focus:ring-primary/20" />
                        <input placeholder="Price (cents)" type="number" value={form.price || ''} onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 focus:ring-2 focus:ring-primary/20" />
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value as AncillaryCategory})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950">
                            {cats.map(c => <option key={c} value={c}>{getCategoryMeta(c).label}</option>)}
                        </select>
                    </div>
                    <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-5 py-3 bg-navy-50 rounded-xl border-none text-sm font-bold resize-none focus:ring-2 focus:ring-primary/20" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => { setShowForm(false); setForm(EMPTY); }} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                {products.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">shopping_bag</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No products yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-50">
                        {products.map(p => {
                            const meta = getCategoryMeta(p.category);
                            return (
                                <div key={p.id} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                                            <span className="material-symbols-outlined">{meta.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-navy-950 uppercase tracking-tight">{p.name}</p>
                                            <p className="text-[9px] font-bold text-navy-400 tracking-widest">{meta.label} • {display(p.price / 100)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleToggle(p)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${p.available ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'}`}>
                                            {p.available ? 'Active' : 'Disabled'}
                                        </button>
                                        <button onClick={() => handleDelete(p)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AncillaryAdmin;
