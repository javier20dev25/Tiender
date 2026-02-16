// src/components/CreateStoreForm.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, AlertCircle } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

interface CreateStoreFormProps {
    onClose: () => void;
    onStoreCreated: () => void;
}

const CreateStoreForm: React.FC<CreateStoreFormProps> = ({ onClose, onStoreCreated }) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if (!user) throw new Error('No usuario autenticado');

            const { error: insertError } = await getSupabase()
                .from('stores')
                .insert([{
                    name: name.trim(),
                    user_id: user.id,
                    plan_type: 'trial',
                    whatsapp_number: user.user_metadata?.phone || user.phone || ''
                }]);

            if (insertError) throw insertError;

            onStoreCreated();
            onClose();
        } catch (err: unknown) {
            setError((err as Error).message || 'Error al crear la tienda');
        } finally {
            setIsSubmitting(false);
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
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="w-full py-5 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shadow-xl shadow-brand-pink/10"
                        >
                            {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Rocket className="w-5 h-5" />}
                            <span>{isSubmitting ? 'Creando...' : 'Empezar a Vender'}</span>
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
