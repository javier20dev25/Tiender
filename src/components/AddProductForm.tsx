// src/components/AddProductForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Package, DollarSign, Image as ImageIcon, Link as LinkIcon,
  Hash, Sparkles, Plus, Upload, Youtube, Zap,
  Layers, AlertCircle
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface AddProductFormProps {
  storeId: string;
  plan_type: string;
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ storeId, plan_type, onClose, onProductAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimerSeconds, setDiscountTimerSeconds] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isWholesaleActive, setIsWholesaleActive] = useState(false);
  const [wholesaleThreshold, setWholesaleThreshold] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      setError('');
      console.log('[AddProductForm] Eager upload: Comprimiendo imagen...');
      const compressionStart = Date.now();
      const compressedFile = await compressImage(file);
      console.log(`[AddProductForm] Imagen comprimida en ${Date.now() - compressionStart}ms. Nuevo tamaño: ${compressedFile.size} bytes`);
      
      const uploadStart = Date.now();
      const fileExtension = compressedFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${storeId}/${fileName}`;

      console.log('[AddProductForm] Eager upload: Subiendo a storage "product-images"...');
      const { error: uploadError } = await getSupabase().storage
        .from('product-images')
        .upload(filePath, compressedFile);

      if (uploadError) {
        console.error('[AddProductForm] Error de upload:', uploadError);
        throw uploadError;
      }

      console.log(`[AddProductForm] Upload exitoso en ${Date.now() - uploadStart}ms`);

      const { data: publicData } = getSupabase().storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log('[AddProductForm] URL pública obtenida:', publicData.publicUrl);
      setUploadedImageUrl(publicData.publicUrl);
    } catch (err: unknown) {
      console.error('[AddProductForm] Error subiendo imagen:', err);
      setError((err as Error).message || 'Error al subir la imagen del producto.');
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !price || !imageFile) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }

    if (!uploadedImageUrl) {
      setError('Espera a que la imagen termine de subirse.');
      return;
    }

    if (title.trim().length < 2 || title.trim().length > 100) {
      setError('El título debe tener entre 2 y 100 caracteres.');
      return;
    }

    if (parseFloat(price) <= 0) {
      setError('El precio debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AddProductForm] Preparando guardado de producto en DB...', { title, price, imageUrl: uploadedImageUrl });
      
      const hashtagsArray = hashtags.split(',').map(h => h.trim()).filter(h => h);

      const insertPayload: Record<string, unknown> = {
        store_id: storeId,
        title,
        description: description || null,
        price: parseFloat(price),
        image_url: uploadedImageUrl,
        external_link: externalLink || null,
        video_link: videoLink || null,
        hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
      };

      if (plan_type === 'full') {
        if (isDiscountActive) {
          insertPayload.discount_timer_seconds = discountTimerSeconds ? parseInt(discountTimerSeconds, 10) : null;
          insertPayload.discount_percentage = discountPercentage ? parseInt(discountPercentage, 10) : null;
        }
        if (isWholesaleActive) {
          insertPayload.wholesale_threshold = wholesaleThreshold ? parseInt(wholesaleThreshold, 10) : null;
          insertPayload.wholesale_price = wholesalePrice ? parseFloat(wholesalePrice) : null;
        }
      }

      console.log('[AddProductForm] Insertando en base de datos...');
      const { error: insertError } = await getSupabase().from('products').insert(insertPayload);
      if (insertError) {
        console.error('[AddProductForm] Error de inserción:', insertError);
        throw insertError;
      }

      console.log('[AddProductForm] Producto guardado con éxito.');
      onProductAdded();
      onClose();
    } catch (error: unknown) {
      console.error('[AddProductForm] Error fatal:', error);
      setError((error as Error).message || 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 focus:border-brand-neon/50 transition-all";
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
            <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 flex items-center justify-center text-brand-neon">
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Nuevo Producto</h2>
              <p className="text-zinc-500 text-xs font-medium">Añade stock a tu tienda social</p>
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

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
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

            <div>
              <label className={labelClasses}><ImageIcon className="w-3.5 h-3.5" /> Imagen Principal</label>
              <div className="relative h-[168px] rounded-3xl border-2 border-dashed border-white/10 bg-zinc-800/30 overflow-hidden group hover:border-brand-neon/30 transition-all">
                {imagePreview ? (
                  <div className="relative w-full h-full group">
                    <img src={imagePreview} alt="Preview" className={`w-full h-full object-cover transition-transform duration-500 ${isUploadingImage ? 'scale-110 opacity-50 blur-sm brightness-50' : 'group-hover:scale-110'}`} />
                    
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mb-2" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">Subiendo...</span>
                      </div>
                    )}

                    <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isUploadingImage ? 'pointer-events-none hidden' : ''}`}>
                      <label className="px-4 py-2 bg-white text-black font-bold rounded-xl cursor-pointer hover:scale-105 transition-transform">Cambiar</label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-white/5 transition-colors">
                    <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-brand-neon transition-colors" />
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Sube una foto</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="hidden" />
                  </label>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="absolute inset-0 opacity-0 cursor-pointer hidden" id="fileInput" />
              </div>
            </div>
          </div>

          {/* Links & Tags */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}><LinkIcon className="w-3.5 h-3.5" /> Link de Checkout (Opcional)</label>
                <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://tu-tienda.com/p1" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}><Youtube className="w-3.5 h-3.5" /> Link de Video / TikTok</label>
                <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://tiktok.com/@user/..." className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}><Hash className="w-3.5 h-3.5" /> Tags (Separados por coma)</label>
              <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="verano, oferta, exclusivo" className={inputClasses} />
            </div>
          </div>

          {/* Plan Full Features */}
          {plan_type === 'full' && (
            <div className="pt-8 border-t border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-yellow" />
                    Funciones Premium
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">Lleva tus ventas al siguiente nivel</p>
                </div>
                <div className="px-2.5 py-1 bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 rounded-full text-[9px] font-black uppercase">Plan Full</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gamified Discount */}
                <div className={`p-6 rounded-3xl border transition-all ${isDiscountActive ? 'bg-brand-neon/5 border-brand-neon/30' : 'bg-zinc-800/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isDiscountActive ? 'bg-brand-neon/20 text-brand-neon' : 'bg-zinc-800 text-zinc-500'}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Oferta "Match"</span>
                    </div>
                    <button type="button" onClick={() => setIsDiscountActive(!isDiscountActive)} className={`w-10 h-6 rounded-full relative transition-colors ${isDiscountActive ? 'bg-brand-neon' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDiscountActive ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {isDiscountActive && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 mb-1 block uppercase">Inactividad (seg.)</label>
                        <input type="number" value={discountTimerSeconds} onChange={(e) => setDiscountTimerSeconds(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-brand-neon" placeholder="30" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 mb-1 block uppercase">Descuento (%)</label>
                        <input type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-brand-neon" placeholder="10" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Wholesale Pricing */}
                <div className={`p-6 rounded-3xl border transition-all ${isWholesaleActive ? 'bg-brand-cyan/5 border-brand-cyan/30' : 'bg-zinc-800/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isWholesaleActive ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-zinc-800 text-zinc-500'}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Al por Mayor</span>
                    </div>
                    <button type="button" onClick={() => setIsWholesaleActive(!isWholesaleActive)} className={`w-10 h-6 rounded-full relative transition-colors ${isWholesaleActive ? 'bg-brand-cyan' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isWholesaleActive ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {isWholesaleActive && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 mb-1 block uppercase">Cant. Mínima</label>
                        <input type="number" value={wholesaleThreshold} onChange={(e) => setWholesaleThreshold(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-brand-cyan" placeholder="6" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 mb-1 block uppercase">Precio Unit.</label>
                        <input type="number" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-brand-cyan" placeholder="0.00" />
                      </div>
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
            disabled={isSubmitting || isUploadingImage}
            className="px-10 py-4 rounded-[20px] bg-brand-neon text-brand-dark font-black uppercase tracking-tighter italic flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex-shrink-0"
          >
            {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" /> : <Plus className="w-5 h-5" />}
            <span>{isSubmitting ? 'Guardando' : isUploadingImage ? 'Esperando...' : 'Publicar Producto'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddProductForm;
