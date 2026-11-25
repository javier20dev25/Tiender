import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Copy, Check, Download, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import type { Store } from '../../types';

interface ShareTopModalProps {
  store: Store;
  onClose: () => void;
}

export const ShareTopModal: React.FC<ShareTopModalProps> = ({ store, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/s/${store.id}`;

  const generateImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await getSupabase().functions.invoke('generate-share-image', {
        body: { storeId: store.id },
      });
      if (fnError) throw fnError;
      if (data?.imageUrl) {
        setImageUrl(`${data.imageUrl}?t=${Date.now()}`);
      } else {
        throw new Error('No se recibió la imagen generada.');
      }
    } catch (err) {
      console.error('[ShareTopModal] Error generating share image:', err);
      setError('No se pudo generar la imagen del Top en este momento.');
    } finally {
      setLoading(false);
    }
  }, [store.id]);

  useEffect(() => {
    generateImage();
  }, [generateImage]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Top Productos de ${store.name}`,
          text: `¡Mira los productos más populares de ${store.name} en Tiender!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-cyan/15 text-brand-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Compartir Top Productos</h3>
              <p className="text-xs text-zinc-400">Listo para historias de WhatsApp, Instagram o Facebook</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa de la imagen generada */}
        <div className="mb-5 rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden flex flex-col items-center justify-center min-h-[260px] p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">Generando imagen del Top 5...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-red-400 font-medium">{error}</p>
              <button
                onClick={generateImage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar
              </button>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Top 5 de ${store.name}`}
              className="max-h-[340px] w-auto rounded-xl shadow-xl border border-white/10 object-contain"
            />
          ) : null}
        </div>

        {/* Enlace compartible con OG image */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">
            Enlace con vista previa del Top (redirige a tu tienda)
          </label>
          <div className="flex items-center gap-2 bg-zinc-800/70 border border-white/10 rounded-2xl p-2 pl-3.5">
            <span className="text-xs text-zinc-300 truncate flex-grow select-all">{shareUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-brand-cyan text-brand-dark font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleNativeShare}
            className="w-full py-3 rounded-2xl bg-sunset-gradient text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir enlace</span>
          </button>
          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`top-${store.slug || store.id}.png`}
              className="w-full py-3 rounded-2xl bg-zinc-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Abrir / Guardar PNG</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          ) : (
            <button
              onClick={generateImage}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-zinc-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerar</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
