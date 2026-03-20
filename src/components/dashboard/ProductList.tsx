import React from 'react';
import { PackageOpen, Plus, Edit3, Trash2 } from 'lucide-react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  loadingProducts: boolean;
  atProductLimit: boolean;
  onAddClick: () => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (id: string, imageUrl: string | null) => void;
}

const PLACEHOLDER_SVG = "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='100%25'%20height='100%25'%20viewBox='0%200%20100%20100'%3E%3Crect%20width='100'%20height='100'%20fill='%23f3f4f6'/%3E%3Cpath%20d='M20%2080L45%2050L60%2065L80%2040'%20stroke='%23d1d5db'%20stroke-width='4'%20fill='none'/%3E%3Ccircle%20cx='35'%20cy='35'%20r='8'%20fill='%23d1d5db'/%3E%3C/svg%3E";

export const ProductList: React.FC<ProductListProps> = ({ products, loadingProducts, atProductLimit, onAddClick, onEditClick, onDeleteClick }) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-brand-neon" />
          Catálogo de Productos
        </h3>
        <button onClick={onAddClick} aria-label="Añadir Producto" disabled={atProductLimit} className="p-2.5 rounded-2xl bg-brand-neon/10 text-brand-neon hover:bg-brand-neon hover:text-brand-dark transition-all disabled:opacity-30">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {loadingProducts ? (
          <p className="text-zinc-600 text-center py-10">Cargando catálogo...</p>
        ) : products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-900 border border-white/5 group hover:border-white/20 transition-all">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border border-white/5">
                <img src={product.image_url || PLACEHOLDER_SVG} alt={product.title} title={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-white truncate">{product.title}</h4>
                <p className="text-brand-neon font-black">${product.price.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEditClick(product)} aria-label="Editar" className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => onDeleteClick(product.id, product.image_url || null)} aria-label="Eliminar" className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
            <div className="p-4 bg-zinc-800/50 rounded-full w-fit mx-auto mb-4"><Plus className="w-8 h-8 text-zinc-600" /></div>
            <p className="text-zinc-500 font-medium">No tienes productos aún.</p>
          </div>
        )}
      </div>
    </div>
  );
};
