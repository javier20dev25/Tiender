// src/components/EditProductForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Package, DollarSign, Image as ImageIcon, Link as LinkIcon,
  Hash, Sparkles, Save, Youtube, Zap,
  Layers, AlertCircle, Edit3
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';

interface EditProductFormProps {
  product: Product;
  plan_type: string;
  onClose: () => void;
  onProductUpdated: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ product, plan_type, onClose, onProductUpdated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimerSeconds, setDiscountTimerSeconds] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isWholesaleActive, setIsWholesaleActive] = useState(false);
  const [wholesaleThreshold, setWholesaleThreshold] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setExternalLink(product.external_link || '');
      setVideoLink(product.video_link || '');
      setHashtags(product.hashtags ? product.hashtags.join(', ') : '');

      const hasDiscount = !!product.discount_percentage && !!product.discount_timer_seconds;
      setIsDiscountActive(hasDiscount);
      setDiscountTimerSeconds(hasDiscount ? String(product.discount_timer_seconds) : '');
      setDiscountPercentage(hasDiscount ? String(product.discount_percentage) : '');

      const hasWholesale = !!product.wholesale_threshold && !!product.wholesale_price;
      setIsWholesaleActive(hasWholesale);
      setWholesaleThreshold(hasWholesale ? String(product.wholesale_threshold) : '');
      setWholesalePrice(hasWholesale ? String(product.wholesale_price) : '');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !price) {
      setError('El nombre y el precio son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hashtagsArray = hashtags.split(',').map(h => h.trim()).filter(h => h);

      const updatePayload: Record<string, unknown> = {
        title,
        description: description || null,
        price: parseFloat(price),
        external_link: externalLink || null,
        video_link: videoLink || null,
        hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
      };

      if (plan_type === 'full') {
        if (isDiscountActive) {
          updatePayload.discount_timer_seconds = discountTimerSeconds ? parseInt(discountTimerSeconds, 10) : null;
          updatePayload.discount_percentage = discountPercentage ? parseInt(discountPercentage, 10) : null;
        } else {
          updatePayload.discount_timer_seconds = null;
          updatePayload.discount_percentage = null;
        }

        if (isWholesaleActive) {
          updatePayload.wholesale_threshold = wholesaleThreshold ? parseInt(wholesaleThreshold, 10) : null;
          updatePayload.wholesale_price = wholesalePrice ? parseFloat(wholesalePrice) : null;
        } else {
          updatePayload.wholesale_threshold = null;
          updatePayload.wholesale_price = null;
        }
      }

      const { error: updateError } = await getSupabase()
        .from('products')
        .update(updatePayload)
        .eq('id', product.id);

      if (updateError) throw updateError;

      onProductUpdated();
      onClose();
    } catch (error: unknown) {
      setError((error as Error).message || 'Error al actualizar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan/50 transition-all text-sm";
  const labelClasses = "flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
              <Edit3 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Editar Producto</h2>
              <p className="text-zinc-500 text-xs font-medium">Modifica los detalles de tu stock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className={labelClasses}><Package className="w-3.5 h-3.5" /> Nombre / Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Camiseta Oversized" className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}><Hash className="w-3.5 h-3.5" /> Descripción (Opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles de tu producto..." className={`${inputClasses} h-24 resize-none`} />
              </div>
              <div>
                <label className={labelClasses}><DollarSign className="w-3.5 h-3.5" /> Precio Venta</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputClasses} required />
              </div>
            </div>

            {/* Thumbnail Preview (Static in Edit) */}
            <div>
              <label className={labelClasses}><ImageIcon className="w-3.5 h-3.5" /> Imagen Actual</label>
              <div className="aspect-square rounded-3xl border border-white/5 bg-zinc-800/30 overflow-hidden">
                <img src={product.image_url || 'https://placehold.co/200x200'} alt="Current" className="w-full h-full object-cover" />
              </div>
              <p className="text-[9px] text-zinc-600 mt-2 text-center uppercase font-bold tracking-tighter">Imagen fija durante edición</p>
            </div>
          </div>

          {/* Links & Tags */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}><LinkIcon className="w-3.5 h-3.5" /> Enlace de Checkout</label>
                <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}><Youtube className="w-3.5 h-3.5" /> Link Viral (Video)</label>
                <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://tiktok.com/..." className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}><Hash className="w-3.5 h-3.5" /> Tags (Optimización)</label>
              <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="verano, limitado" className={inputClasses} />
            </div>
          </div>

          {/* Premium Features */}
          {plan_type === 'full' && (
            <div className="pt-8 border-t border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-yellow" />
                  Ajustes Avanzados
                </h3>
                <div className="px-2.5 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Plan Full</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-6 rounded-3xl border transition-all ${isDiscountActive ? 'bg-brand-neon/5 border-brand-neon/30' : 'bg-zinc-800/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className={`w-4 h-4 ${isDiscountActive ? 'text-brand-neon' : 'text-zinc-600'}`} />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Oferta "Match"</span>
                    </div>
                    <button type="button" onClick={() => setIsDiscountActive(!isDiscountActive)} className={`w-10 h-6 rounded-full relative transition-colors ${isDiscountActive ? 'bg-brand-neon' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDiscountActive ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {isDiscountActive && (
                    <div className="space-y-4">
                      <input type="number" value={discountTimerSeconds} onChange={(e) => setDiscountTimerSeconds(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm" placeholder="Segundos" />
                      <input type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm" placeholder="Porcentaje %" />
                    </div>
                  )}
                </div>

                <div className={`p-6 rounded-3xl border transition-all ${isWholesaleActive ? 'bg-brand-cyan/5 border-brand-cyan/30' : 'bg-zinc-800/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Layers className={`w-4 h-4 ${isWholesaleActive ? 'text-brand-cyan' : 'text-zinc-600'}`} />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Mayorista</span>
                    </div>
                    <button type="button" onClick={() => setIsWholesaleActive(!isWholesaleActive)} className={`w-10 h-6 rounded-full relative transition-colors ${isWholesaleActive ? 'bg-brand-cyan' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isWholesaleActive ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {isWholesaleActive && (
                    <div className="space-y-4">
                      <input type="number" value={wholesaleThreshold} onChange={(e) => setWholesaleThreshold(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm" placeholder="Cant. Mínima" />
                      <input type="number" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm" placeholder="Precio Mayor" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-8 bg-zinc-950 border-t border-white/5 flex items-center justify-end gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl text-zinc-400 font-bold hover:text-white transition-colors uppercase tracking-widest text-xs">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-4 rounded-[20px] bg-brand-cyan text-brand-dark font-black uppercase tracking-tighter italic flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
          >
            {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" /> : <Save className="w-5 h-5" />}
            <span>{isSubmitting ? 'Guardando' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProductForm;
