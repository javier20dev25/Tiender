import React from 'react';
import { motion } from 'framer-motion';
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

const PLACEHOLDER_SVG = "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='100%25'%20height='100%25'%20viewBox='0%200%20100%20100'%3E%3Crect%20width='100'%20height='100'%20fill='%23f1f5f9'/%3E%3Cpath%20d='M20%2080L45%2050L60%2065L80%2040'%20stroke='%23cbd5e1'%20stroke-width='4'%20fill='none'/%3E%3Ccircle%20cx='35'%20cy='35'%20r='8'%20fill='%23cbd5e1'/%3E%3C/svg%3E";

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loadingProducts,
  atProductLimit,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  const getCurrencySymbol = (product: Product) => {
    return product.currency === 'NIO' ? 'C$' : '$';
  };

  return (
    <div className="lg:col-span-2 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
          <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
            <PackageOpen className="w-5 h-5" />
          </div>
          Catálogo de Productos
        </h3>
        <button
          onClick={onAddClick}
          aria-label="Añadir Producto"
          disabled={atProductLimit}
          className="p-2.5 rounded-2xl bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95"
          title="Crear nuevo producto"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-3.5">
        {loadingProducts ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2"></div>
            Cargando catálogo...
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100 bg-slate-50">
                <img
                  src={product.image_url || PLACEHOLDER_SVG}
                  alt={product.title}
                  title={product.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-slate-900 text-base truncate">{product.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-violet-600 font-black text-base">
                    {getCurrencySymbol(product)}{product.price.toFixed(2)}
                  </p>
                  {product.currency && (
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {product.currency}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditClick(product)}
                  aria-label="Editar"
                  className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
                  title="Editar producto"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteClick(product.id, product.image_url || null)}
                  aria-label="Eliminar"
                  className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <Plus className="w-8 h-8 text-violet-600" />
            </div>
            <p className="text-slate-600 font-semibold mb-6">No tienes productos en tu catálogo aún.</p>
            <button
              onClick={onAddClick}
              disabled={atProductLimit}
              className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 shadow-sm disabled:opacity-30"
            >
              <Plus className="w-5 h-5" />
              <span>Crear primer producto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
