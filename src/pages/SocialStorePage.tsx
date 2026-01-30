// src/pages/SocialStorePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Store, Product } from '../types'; // Utilizando tipos centralizados

// --- Types ---
// El tipo CartItem ahora se deriva de los tipos importados
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
  const [productInteractions, setProductInteractions] = useState<{ [productId: string]: 'liked' | 'disliked' }>({});
  const hasLoggedVisit = useRef(false);

  // --- Data Fetching ---
  const fetchStoreAndProducts = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');

    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url, whatsapp_number')
        .eq('id', storeId)
        .single();

      if (storeError) throw new Error('No se pudo cargar la tienda.');
      setStore(storeData as Store);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, image_url, external_link, video_link') // Campos añadidos
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) throw new Error('No se pudieron cargar los productos.');
      setProducts(productsData || []);

    } catch (error: unknown) {
        console.error("Error fetching store data:", error);
        setError('No se pudo cargar la tienda. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
  }, [storeId]);

  useEffect(() => {
    fetchStoreAndProducts();
  }, [fetchStoreAndProducts]);

  // --- Analytics (sin cambios) ---
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const logEvent = useCallback(async (eventType: 'VISIT' | 'LIKE' | 'DISLIKE' | 'ADD_TO_CART') => {
    if (!storeId) return;
    
    const isProductEvent = eventType !== 'VISIT';
    const currentProductId = products[currentIndex]?.id;

    if (isProductEvent && !currentProductId) {
      console.warn(`logEvent: Missing product_id for event type ${eventType}`);
      return;
    }
    
    try {
      const payload: { store_id: string; event_type: string; product_id?: string; session_id: string; } = {
        store_id: storeId,
        event_type: eventType,
        product_id: isProductEvent ? currentProductId : undefined,
        session_id: getSessionId(),
      };

      await supabase.functions.invoke('log-product-event', { body: payload });

    } catch (error) {
      console.error('Error logging event:', error);
    }
  }, [storeId, currentIndex, products]);

  useEffect(() => {
    if (store && !hasLoggedVisit.current) {
      logEvent('VISIT');
      hasLoggedVisit.current = true;
    }
  }, [store, logEvent]);


  // --- Lógica de UI y Carrito (sin cambios) ---
  const setCartQuantity = (product: Product, newQuantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (newQuantity <= 0) return prevCart.filter(item => item.id !== product.id);
      if (existingItem) return prevCart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      return [...prevCart, { ...product, quantity: newQuantity }];
    });
  };

  const handleNextProduct = () => setCurrentIndex(prev => (prev + 1) % products.length);
  const handlePreviousProduct = () => setCurrentIndex(prev => (prev - 1 + products.length) % products.length);
  
  const handleLike = () => {
    const currentProduct = products[currentIndex];
    if (!currentProduct) return;
    logEvent('LIKE');
    setProductInteractions(prev => ({...prev, [currentProduct.id]: 'liked'}));
    handleNextProduct();
  };
  
  const handleDislike = () => {
    const currentProduct = products[currentIndex];
    if (!currentProduct) return;
    logEvent('DISLIKE');
    setProductInteractions(prev => ({...prev, [currentProduct.id]: 'disliked'}));
    handleNextProduct();
  };

  const handleAddToCart = () => {
    if (products.length === 0) return;
    const currentProduct = products[currentIndex];
    setCartQuantity(currentProduct, 1);
    logEvent('ADD_TO_CART');
  };

  const handleIncreaseQuantity = () => {
    const currentProduct = products[currentIndex];
    const currentQuantity = cart.find(item => item.id === currentProduct.id)?.quantity || 0;
    setCartQuantity(currentProduct, currentQuantity + 1);
    logEvent('ADD_TO_CART');
  };

  const handleDecreaseQuantity = () => {
    const currentProduct = products[currentIndex];
    const currentQuantity = cart.find(item => item.id === currentProduct.id)?.quantity || 0;
    setCartQuantity(currentProduct, currentQuantity - 1);
  };

  // --- Renderizado ---
  if (loading) return <div className="flex justify-center items-center min-h-screen">Cargando tienda...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  if (!store) return <div className="flex justify-center items-center min-h-screen">Tienda no encontrada.</div>;

  if (!store.name || !store.logo_url) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">🚧 Tienda en Construcción 🚧</h1>
        <p className="text-lg text-gray-500">El vendedor todavía está preparando esta tienda. ¡Vuelve pronto!</p>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const currentQuantity = currentProduct ? (cart.find(item => item.id === currentProduct.id)?.quantity || 0) : 0;
  const interaction = currentProduct ? productInteractions[currentProduct.id] : null;

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <header className="text-center mb-6">
        {store.logo_url && <img src={store.logo_url} alt="Logo" className="mx-auto h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />}
        <h1 className="text-4xl font-bold text-gray-800">{store.name}</h1>
      </header>

      {products.length > 0 && currentProduct ? (
        <div className="relative">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6 aspect-square">
            <img src={currentProduct.image_url || 'https://placehold.co/600x400'} alt={currentProduct.title} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              <h3 className="text-2xl font-bold text-white">{currentProduct.title}</h3>
              <p className="text-xl font-semibold text-green-300">${currentProduct.price.toFixed(2)}</p>
              
              {/* --- NUEVOS ENLACES --- */}
              <div className="flex items-center space-x-4 mt-2">
                {currentProduct.external_link && (
                  <a
                    href={currentProduct.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Evita la interacción con la tarjeta
                    className="text-white text-2xl hover:text-green-300 transition-colors"
                    aria-label="Ver producto en otra tienda"
                  >
                    🛒
                  </a>
                )}
                {currentProduct.video_link && (
                  <a
                    href={currentProduct.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Evita la interacción con la tarjeta
                    className="text-white text-2xl hover:text-red-400 transition-colors"
                    aria-label="Ver video del producto"
                  >
                    ▶️
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-center items-center mb-4 h-16">
            {currentQuantity === 0 ? (
                <button onClick={handleAddToCart} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform">AÑADIR AL CARRITO</button>
            ) : (
                <div className="flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg shadow-lg">
                    <button onClick={handleDecreaseQuantity} className="px-5 py-4 text-2xl">-</button>
                    <span className="px-4 py-4 text-xl">{currentQuantity}</span>
                    <button onClick={handleIncreaseQuantity} className="px-5 py-4 text-2xl">+</button>
                </div>
            )}
          </div>

          <div className="relative z-10 flex justify-around items-center">
            <button onClick={handlePreviousProduct} disabled={products.length <= 1} className="p-3 bg-white rounded-full shadow-lg text-gray-700 text-2xl transition-transform hover:scale-110 disabled:opacity-50">⬅️</button>
            <button onClick={handleDislike} disabled={!!interaction} aria-label="Dislike this product" className={`p-4 rounded-full shadow-lg text-3xl transition-transform hover:scale-110 disabled:opacity-75 ${interaction === 'disliked' ? 'bg-red-500 text-white' : 'bg-white text-red-500'}`}>❌</button>
            <button onClick={handleLike} disabled={!!interaction} aria-label="Like this product" className={`p-4 rounded-full shadow-lg text-3xl transition-transform hover:scale-110 disabled:opacity-75 ${interaction === 'liked' ? 'bg-green-500 text-white' : 'bg-white text-green-500'}`}>❤️</button>
            <button onClick={handleNextProduct} disabled={products.length <= 1} className="p-3 bg-white rounded-full shadow-lg text-gray-700 text-2xl transition-transform hover:scale-110 disabled:opacity-50">➡️</button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-20">¡Esta tienda aún no tiene productos!</p>
      )}
      
      {cart.length > 0 && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl">
          🛒<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      )}

      {isCartOpen && <CartModal cart={cart} storeName={store.name} sellerPhone={store.whatsapp_number || ''} onClose={() => setIsCartOpen(false)} />}
    </div>
  );
};

const CartModal: React.FC<{ cart: CartItem[], storeName: string, sellerPhone: string, onClose: () => void }> = ({ cart, storeName, sellerPhone, onClose }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let message = `¡Hola ${storeName}! Quisiera hacer un pedido:\n\n`;
    cart.forEach(item => {
      message += `- ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Total: $${total.toFixed(2)}*`;
    return encodeURIComponent(message);
  };

  const whatsappUrl = `https://wa.me/${sellerPhone}?text=${generateWhatsAppMessage()}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Tu Pedido</h2>
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex items-center space-x-4">
              <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-semibold leading-tight">{item.title}</p>
                <p className="text-sm text-gray-600">x{item.quantity} - ${item.price.toFixed(2)} c/u</p>
              </div>
              <p className="font-bold text-right">${(item.price * item.quantity).toFixed(2)}</p>
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