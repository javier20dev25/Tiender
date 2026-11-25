import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Copy, ExternalLink, Edit3, PackageOpen, Sparkles, Check } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import type { Store } from '../../types';

interface StoreHeaderProps {
  store: Store;
  onEditClick: () => void;
  onUpgradeClick: () => void;
  onShareClick?: () => void;
  isSubmittingUpgrade: boolean;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  onEditClick,
  onUpgradeClick,
  onShareClick,
  isSubmittingUpgrade,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const getCanonicalShareUrl = (storeId: string) => {
    const origin = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : 'https://tiender.vercel.app';
    return `${origin}/s/${storeId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getCanonicalShareUrl(store.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (onShareClick) {
      onShareClick();
      return;
    }
    setIsSharing(true);
    try {
      await getSupabase().functions.invoke('generate-share-image', { body: { storeId: store.id } });
      const shareUrl = getCanonicalShareUrl(store.id);
      if (navigator.share) {
        await navigator.share({ title: `Visita ${store.name}`, text: `Mira mis productos en Tiender`, url: shareUrl });
      } else {
        handleCopyLink();
      }
    } catch {
      handleCopyLink();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-7 rounded-[28px] bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
      <div className="flex items-center space-x-5">
        <div className="relative group flex-shrink-0">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-16 w-16 object-cover rounded-full border-2 border-slate-200 ring-4 ring-slate-100 shadow-md"
            />
          ) : (
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 ring-4 ring-slate-50 shadow-sm">
              <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{store.name}</h2>
            <button
              onClick={onEditClick}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
              title="Editar perfil de la tienda"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Plan {store.plan_type}
            </span>
            {store.plan_type !== 'full' && (
              <button
                onClick={onUpgradeClick}
                disabled={isSubmittingUpgrade}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1 group"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                Mejorar Plan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/tienda/${store.id}`}
          target="_blank"
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-all flex items-center gap-2 border border-slate-200 text-xs sm:text-sm"
        >
          <ExternalLink className="w-4 h-4 text-slate-600" />
          <span>Ver Tienda</span>
        </Link>
        <button
          onClick={handleCopyLink}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-all flex items-center gap-2 border border-slate-200 text-xs sm:text-sm"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
          <span>{copied ? '¡Copiado!' : 'Enlace'}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs sm:text-sm shadow-sm shadow-violet-500/20"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? 'Generando...' : 'Compartir'}</span>
        </button>
      </div>
    </div>
  );
};
