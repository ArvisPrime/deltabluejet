import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { useCurrency } from '../../hooks/useCurrency';
import {
    getAvailableProducts,
    addAncillaryToBooking,
    getCategoryMeta,
    type AncillaryProduct,
    type AncillaryCategory,
} from '../../services/ancillaryService';

interface AncillaryAddOnsProps {
    bookingId: string;
    onComplete?: () => void;
}

const AncillaryAddOns: React.FC<AncillaryAddOnsProps> = ({ bookingId, onComplete }) => {
    const addToast = useToastStore(s => s.addToast);
    const { display } = useCurrency();
    const [products, setProducts] = useState<AncillaryProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Map<string, number>>(new Map());
    const [adding, setAdding] = useState(false);
    const [filterCat, setFilterCat] = useState<AncillaryCategory | 'all'>('all');

    useEffect(() => {
        getAvailableProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
    }, []);

    const toggleProduct = (id: string) => {
        const next = new Map(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.set(id, 1);
        }
        setSelected(next);
    };

    const totalPrice = Array.from(selected.entries()).reduce((sum, [id, qty]) => {
        const p = products.find(p => p.id === id);
        return sum + (p ? p.price * qty : 0);
    }, 0);

    const handleConfirm = async () => {
        setAdding(true);
        try {
            for (const [id, qty] of selected.entries()) {
                const product = products.find(p => p.id === id);
                if (product) await addAncillaryToBooking(bookingId, product, qty);
            }
            addToast(`${selected.size} add-on(s) confirmed!`, 'success');
            setSelected(new Map());
            onComplete?.();
        } catch {
            addToast('Failed to add services', 'error');
        } finally {
            setAdding(false);
        }
    };

    const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);
    const categories = [...new Set(products.map(p => p.category))];

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display pb-32">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Enhance Your Flight</h1>
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Add baggage, meals, lounge access, and more</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterCat('all')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCat === 'all' ? 'bg-navy-950 text-white shadow-lg' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}>All</button>
                {categories.map(cat => {
                    const meta = getCategoryMeta(cat);
                    return (
                        <button key={cat} onClick={() => setFilterCat(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterCat === cat ? 'bg-navy-950 text-white shadow-lg' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}>
                            <span className="material-symbols-outlined text-sm">{meta.icon}</span> {meta.label}
                        </button>
                    );
                })}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <div className="col-span-full text-center py-16 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">shopping_bag</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No add-ons available</p>
                    </div>
                ) : filtered.map(product => {
                    const meta = getCategoryMeta(product.category);
                    const isSelected = selected.has(product.id);
                    return (
                        <button
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={`text-left p-8 rounded-[2.5rem] border-2 transition-all group ${isSelected ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-navy-100 bg-white hover:border-navy-200 hover:shadow-lg'}`}
                        >
                            <div className="flex items-start gap-4 mb-5">
                                <div className={`size-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : meta.color}`}>
                                    <span className="material-symbols-outlined text-2xl">{product.iconName || meta.icon}</span>
                                </div>
                                {isSelected && <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>}
                            </div>
                            <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight mb-1">{product.name}</h3>
                            <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed mb-4">{product.description}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-navy-50">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                                <span className="text-lg font-black text-navy-950 tracking-tighter">{display(product.price / 100)}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Sticky Bottom Bar */}
            {selected.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-navy-100 px-8 py-5 z-50 shadow-2xl">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{selected.size} add-on(s) selected</p>
                            <p className="text-2xl font-black text-navy-950 tracking-tighter">{display(totalPrice / 100)}</p>
                        </div>
                        <button onClick={handleConfirm} disabled={adding} className="px-10 py-4 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                            {adding ? 'Adding…' : 'Confirm Add-ons'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AncillaryAddOns;
