// src/pages/SocialStorePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// --- Types ---
type Store = {
  id: string;
  name: string;
  logo_url: string | null;
};

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
};

type CartItem = Product & { quantity: number };

// --- Main Component ---
const SocialStorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Data Fetching ---
  const fetchStoreAndProducts = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');

    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url')
        .eq('id', storeId)
        .single();

      if (storeError) throw new Error('No se pudo cargar la tienda.');
      setStore(storeData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, image_url')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) throw new Error('No se pudieron cargar los productos.');
      setProducts(productsData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreAndProducts();
  }, [fetchStoreAndProducts]);

  // --- UI Handlers ---
  const handleNextProduct = () => {
    setCurrentIndex(prev => (prev + 1) % products.length);
  };

  const handleAddToCart = () => {
    if (products.length === 0) return;
    const currentProduct = products[currentIndex];
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === currentProduct.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === currentProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...currentProduct, quantity: 1 }];
    });
    handleNextProduct(); // Move to next product after adding to cart
  };

  // --- Render Functions ---
  if (loading) return <div className="flex justify-center items-center min-h-screen">Cargando tienda...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  if (!store) return <div className="flex justify-center items-center min-h-screen">Tienda no encontrada.</div>;

  const currentProduct = products[currentIndex];

  return (
    <div className="container mx-auto p-4 max-w-lg">
      {/* Store Header */}
      <div className="text-center mb-6">
        {store.logo_url && <img src={store.logo_url} alt="Logo" className="mx-auto h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />}
        <h1 className="text-4xl font-bold text-gray-800">{store.name}</h1>
      </div>

      {/* Product Tinder Card */}
      {products.length > 0 ? (
        <div className="relative">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6 aspect-square">
            {currentProduct.image_url && <img src={currentProduct.image_url} alt={currentProduct.title} className="w-full h-full object-cover" />}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              <h3 className="text-2xl font-bold text-white">{currentProduct.title}</h3>
              <p className="text-xl font-semibold text-green-300">${currentProduct.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-around items-center mb-6">
            <button onClick={handleNextProduct} className="p-4 bg-white rounded-full shadow-lg text-red-500 text-3xl">❌</button>
            <button onClick={handleAddToCart} className="px-6 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg transform scale-110">AÑADIR AL CARRITO</button>
            <button onClick={handleNextProduct} className="p-4 bg-white rounded-full shadow-lg text-green-500 text-3xl">❤️</button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">¡Esta tienda aún no tiene productos!</p>
      )}
      
      {/* Cart Bubble */}
      {cart.length > 0 && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 bg-green-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl">
          🛒
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && <CartModal cart={cart} storeName={store.name} onClose={() => setIsCartOpen(false)} />}
    </div>
  );
};

// --- Cart Modal Component ---
const CartModal: React.FC<{ cart: CartItem[], storeName: string, onClose: () => void }> = ({ cart, storeName, onClose }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let message = `¡Hola ${storeName}! Quisiera hacer un pedido:\n\n`;
    cart.forEach(item => {
      message += `- ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Total: $${total.toFixed(2)}*`;
    return encodeURIComponent(message);
  };

  const whatsappUrl = `https://wa.me/?text=${generateWhatsAppMessage()}`; // Assumes seller's number is known or handled elsewhere

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Tu Pedido</h2>
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-600">x{item.quantity} - ${item.price.toFixed(2)} c/u</p>
              </div>
              <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 flex justify-between items-center font-bold text-xl">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="mt-6 flex flex-col space-y-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600">
            Hacer Pedido por WhatsApp
          </a>
          <button onClick={onClose} className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialStorePage;
