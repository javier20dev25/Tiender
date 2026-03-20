import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Copy, ExternalLink, Edit3, PackageOpen, Sparkles } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import type { Store } from '../../types';

interface StoreHeaderProps {
  store: Store;
  onEditClick: () => void;
  onUpgradeClick: () => void;
  isSubmittingUpgrade: boolean;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ store, onEditClick, onUpgradeClick, isSubmittingUpgrade }) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tienda/${store.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await getSupabase().functions.invoke('generate-share-image', { body: { storeId: store.id } });
      const shareUrl = `${window.location.origin}/tienda/${store.id}`;
      if (navigator.share) {
        await navigator.share({ title: `Visita ${store.name}`, text: `Mira mis productos en Tiender`, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Enlace copiado.');
      }
    } catch {
      alert("Error al compartir.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[30px] bg-zinc-900 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon/5 blur-[100px] -z-10"></div>
      <div className="flex items-center space-x-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-sunset-gradient opacity-0 group-hover:opacity-20 blur-md transition-opacity rounded-full"></div>
          {store.logo_url ? (
            <img src={store.logo_url} alt="" className="h-16 w-16 object-cover rounded-full border-2 border-white/10 ring-4 ring-black shadow-2xl" />
          ) : (
            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-white/10 ring-4 ring-black shadow-2xl">
              <PackageOpen className="w-8 h-8 text-zinc-600" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{store.name}</h2>
            <button
              onClick={onEditClick}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-brand-neon hover:bg-zinc-700 transition-all group"
              title="Editar perfil de la tienda"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-zinc-800 text-brand-cyan rounded-full border border-brand-cyan/20">Plan {store.plan_type}</span>
            {store.plan_type !== 'full' && (
              <button onClick={onUpgradeClick} disabled={isSubmittingUpgrade} className="text-xs font-bold text-brand-pink hover:text-white transition-colors flex items-center gap-1 group">
                <Sparkles className="w-3 h-3 group-hover:animate-spin" />
                Mejorar Plan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/tienda/${store.id}`} target="_blank" className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-2 border border-white/5">
          <ExternalLink className="w-4 h-4" />
          <span>Ver Tienda</span>
        </Link>
        <button onClick={handleCopyLink} className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-2 border border-white/5">
          <Copy className="w-4 h-4" />
          <span>{copied ? '¡Copiado!' : 'Enlace'}</span>
        </button>
        <button onClick={handleShare} disabled={isSharing} className="px-5 py-2.5 bg-brand-cyan text-brand-dark font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? '...' : 'Compartir'}</span>
        </button>
      </div>
    </div>
  );
};
