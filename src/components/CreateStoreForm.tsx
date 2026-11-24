// src/components/CreateStoreForm.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabaseClient';

interface CreateStoreFormProps {
    onClose: () => void;
}

const CreateStoreForm: React.FC<CreateStoreFormProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsCreating(true);
        setError('');

        try {
            const cleanName = name.trim();
            const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
            const userPhone = user?.user_metadata?.phone || (user?.email ? user.email.split('@')[0] : '');

            const trialEnds = new Date();
            trialEnds.setFullYear(trialEnds.getFullYear() + 5);

            const { data: newStore, error: insertError } = await getSupabase()
                .from('stores')
                .insert({
                    user_id: user?.id,
                    name: cleanName,
                    slug: slug,
                    whatsapp_number: userPhone,
                    plan_type: 'full',
                    trial_ends_at: trialEnds.toISOString(),
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (newStore && user?.id) {
                localStorage.setItem(`tiender_store_${user.id}`, JSON.stringify({
                    ...newStore,
                    billing_exempt: true
                }));
            }

            window.location.reload();
        } catch (err: unknown) {
            console.error('[CreateStoreForm] error:', err);
            const msg = err instanceof Error ? err.message : 'Error al crear la tienda.';
            setError(msg);
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden p-10 text-center"
            >
                <div className="w-20 h-20 rounded-3xl bg-sunset-gradient flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-brand-pink/20">
                    <Rocket className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Lanza tu Tienda</h2>
                <p className="text-zinc-500 text-sm font-medium mb-10">Dale un nombre a tu nuevo imperio social</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-left">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2">Nombre de tu Marca</label>
                        <input
                            type="text"
                            placeholder="Ej: Urban Style Shop"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all font-bold"
                            required
                            disabled={isCreating}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="w-full py-5 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
                        >
                            {isCreating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Rocket className="w-5 h-5" />
                                    <span>Crear mi Tienda</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors py-2"
                        >
                            Ahora no
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateStoreForm;
