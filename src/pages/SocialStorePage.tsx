// src/pages/SocialStorePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Store, Product } from '../types';

// Tipos
type CartItem = Product & { quantity: number; final_price?: number };

// Componente Principal
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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const hasLoggedVisit = useRef(false);

  // Obtención de datos
  const fetchStoreAndProducts = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');

    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url, whatsapp_number, slug, user_id, created_at, trial_ends_at, plan_type, community_link')
        .eq('id', storeId)
        .single();

      if (storeError) throw new Error('No se pudo cargar la tienda.');
      setStore(storeData);

      const { data: productsData, error: productsError } = await supabase
        .rpc('get_store_products', { target_store_id: storeData.id });

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

  // Lógica de Descuento por Inactividad
  useEffect(() => {
    setShowDiscountModal(false); // Cierra el modal al cambiar de producto
    const currentProduct = products[currentIndex];
    
    if (store?.plan_type === 'full' && currentProduct?.discount_timer_seconds && currentProduct?.discount_percentage) {
      const timer = setTimeout(() => {
        setShowDiscountModal(true);
      }, currentProduct.discount_timer_seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, products, store]);

  // Analíticas
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const logEvent = useCallback(async (eventType: 'VISIT' | 'LIKE' | 'DISLIKE' | 'ADD_TO_CART' | 'ADD_TO_CART_DISCOUNT') => {
    if (!storeId) return;
    
    const isProductEvent = eventType !== 'VISIT';
    const currentProductId = products[currentIndex]?.id;

    if (isProductEvent && !currentProductId) return;
    
    try {
      await supabase.functions.invoke('log-product-event', {
        body: {
          store_id: storeId,
          event_type: eventType,
          product_id: isProductEvent ? currentProductId : undefined,
          session_id: getSessionId(),
        }
      });
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

  // Lógica del Carrito
  const setCartQuantity = (product: Product, newQuantity: number, priceOverride?: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== product.id);
      }
      
      const priceToUse = priceOverride ?? existingItem?.final_price ?? product.price;

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity, final_price: priceToUse } : item
        );
      }
      
      return [...prevCart, { ...product, quantity: newQuantity, final_price: priceToUse }];
    });
  };

  const handleNextProduct = () => setCurrentIndex(prev => (prev + 1) % products.length);
  const handlePreviousProduct = () => setCurrentIndex(prev => (prev - 1 + products.length) % products.length);
  
  const handleLike = () => {
    if (!products[currentIndex]) return;
    logEvent('LIKE');
    setProductInteractions(prev => ({...prev, [products[currentIndex].id]: 'liked'}));
    handleNextProduct();
  };
  
  const handleDislike = () => {
    if (!products[currentIndex]) return;
    logEvent('DISLIKE');
    setProductInteractions(prev => ({...prev, [products[currentIndex].id]: 'disliked'}));
    handleNextProduct();
  };

  const handleAddToCart = () => {
    const currentProduct = products[currentIndex];
    if (!currentProduct) return;
    const currentQuantity = cart.find(item => item.id === currentProduct.id)?.quantity || 0;
    setCartQuantity(currentProduct, currentQuantity + 1);
    logEvent('ADD_TO_CART');
  };
  
  const handleAddToCartWithDiscount = (product: Product) => {
    if (!product.discount_percentage) return;
    const discountedPrice = product.price - (product.price * (product.discount_percentage / 100));
    const currentQuantity = cart.find(item => item.id === product.id)?.quantity || 0;
    setCartQuantity(product, currentQuantity + 1, discountedPrice);
    logEvent('ADD_TO_CART_DISCOUNT');
  };

  const handleIncreaseQuantity = (productId: string) => {
    const product = products.find(p => p.id === productId) || cart.find(c => c.id === productId);
    if (!product) return;
    const currentQuantity = cart.find(item => item.id === productId)?.quantity || 0;
    setCartQuantity(product, currentQuantity + 1);
    logEvent('ADD_TO_CART');
  };

  const handleDecreaseQuantity = (productId: string) => {
    const product = products.find(p => p.id === productId) || cart.find(c => c.id === productId);
    if (!product) return;
    const currentQuantity = cart.find(item => item.id === productId)?.quantity || 0;
    setCartQuantity(product, currentQuantity - 1);
  };

  // Renderizado
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
  const currentQuantityInCart = currentProduct ? (cart.find(item => item.id === currentProduct.id)?.quantity || 0) : 0;
  const interaction = currentProduct ? productInteractions[currentProduct.id] : null;
  const showCommunityCTA = store && store.plan_type === 'full' && store.community_link && cart.length === 0 && currentIndex === products.length - 1;

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
            {store.plan_type === 'full' && currentProduct.is_hot && (
              <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-2">
                <span className="text-2xl" role="img" aria-label="Producto Caliente">🔥</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              <h3 className="text-2xl font-bold text-white">{currentProduct.title}</h3>
              <p className="text-xl font-semibold text-green-300">${currentProduct.price.toFixed(2)}</p>
              {store.plan_type === 'full' && currentProduct.hashtags?.length && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentProduct.hashtags.map((tag, i) => <span key={i} className="text-xs font-semibold text-white bg-white/20 px-2 py-1 rounded-full">#{tag}</span>)}
                </div>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {currentProduct.external_link && <a href={currentProduct.external_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-white text-2xl hover:text-green-300">🛒</a>}
                {currentProduct.video_link && <a href={currentProduct.video_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-white text-2xl hover:text-red-400">▶️</a>}
              </div>
            </div>
          </div>
          <div className="relative z-10 flex justify-center items-center mb-4 h-16">
            {currentQuantityInCart === 0 ? (
                <button onClick={handleAddToCart} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105">AÑADIR AL CARRITO</button>
            ) : (
                <div className="flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg shadow-lg">
                    <button onClick={() => handleDecreaseQuantity(currentProduct.id)} className="px-5 py-4 text-2xl">-</button>
                    <span className="px-4 py-4 text-xl">{currentQuantityInCart}</span>
                    <button onClick={() => handleIncreaseQuantity(currentProduct.id)} className="px-5 py-4 text-2xl">+</button>
                </div>
            )}
          </div>
          <div className="relative z-10 flex justify-around items-center">
            <button onClick={handlePreviousProduct} disabled={products.length <= 1} className="p-3 bg-white rounded-full shadow-lg text-gray-700 text-2xl">⬅️</button>
            <button onClick={handleDislike} disabled={!!interaction} className={`p-4 rounded-full shadow-lg text-3xl ${interaction === 'disliked' ? 'bg-red-500 text-white' : 'bg-white text-red-500'}`}>❌</button>
            <button onClick={handleLike} disabled={!!interaction} className={`p-4 rounded-full shadow-lg text-3xl ${interaction === 'liked' ? 'bg-green-500 text-white' : 'bg-white text-green-500'}`}>❤️</button>
            <button onClick={handleNextProduct} disabled={products.length <= 1} className="p-3 bg-white rounded-full shadow-lg text-gray-700 text-2xl">➡️</button>
          </div>
          {showCommunityCTA && (
            <div className="mt-8 text-center p-4 bg-gray-100 rounded-lg">
              <h4 className="font-bold text-lg mb-2">¿Te gustó lo que viste?</h4>
              <p className="text-gray-600 mb-4">Únete a nuestra comunidad para no perderte las novedades.</p>
              <a href={store.community_link as string} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md">Unirse al Grupo</a>
            </div>
          )}
        </div>
      ) : <p className="text-center text-gray-500 py-20">¡Esta tienda aún no tiene productos!</p>}
      {cart.length > 0 && <button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl">🛒<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></button>}
      {isCartOpen && <CartModal cart={cart} storeName={store.name} sellerPhone={store.whatsapp_number || ''} onClose={() => setIsCartOpen(false)} onIncrease={handleIncreaseQuantity} onDecrease={handleDecreaseQuantity} />}
      {showDiscountModal && currentProduct && <DiscountModal product={currentProduct} onClose={() => setShowDiscountModal(false)} onAddToCart={handleAddToCartWithDiscount} />}
      <footer className="text-center mt-8 py-4"><a href="/" className="text-sm text-gray-500 hover:text-gray-700">Crea tu tienda con Tiender</a></footer>
    </div>
  );
};

const CartModal: React.FC<{ cart: CartItem[], storeName: string, sellerPhone: string, onClose: () => void, onIncrease: (id: string) => void, onDecrease: (id: string) => void }> = ({ cart, storeName, sellerPhone, onClose, onIncrease, onDecrease }) => {
  const total = cart.reduce((sum, item) => sum + (item.final_price ?? item.price) * item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let message = `¡Hola ${storeName}! Quisiera hacer un pedido:\n\n`;
    cart.forEach(item => {
      const price = item.final_price ?? item.price;
      message += `- ${item.title} (x${item.quantity}) - $${(price * item.quantity).toFixed(2)}\n`;
      if (item.final_price) message += `  (Con descuento)\n`;
    });
    message += `\n*Total: $${total.toFixed(2)}*`;
    return encodeURIComponent(message);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Tu Pedido</h2>
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex items-center space-x-4">
              <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-grow">
                <p className="font-semibold leading-tight">{item.title}</p>
                <div className="flex items-center text-sm">
                  <button onClick={() => onDecrease(item.id)} className="px-2">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onIncrease(item.id)} className="px-2">+</button>
                </div>
              </div>
              <p className="font-bold text-right">$${((item.final_price ?? item.price) * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 flex justify-between items-center font-bold text-xl">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
        <div className="mt-6 flex flex-col space-y-3">
          <a href={`https://wa.me/${sellerPhone}?text=${generateWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md">Hacer Pedido por WhatsApp</a>
          <button onClick={onClose} className="w-full text-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const DiscountModal: React.FC<{ product: Product; onClose: () => void; onAddToCart: (product: Product) => void; }> = ({ product, onClose, onAddToCart }) => {
  if (!product.discount_percentage) return null;
  const discountedPrice = product.price - (product.price * (product.discount_percentage / 100));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-2">¡Oferta Especial!</h2>
        <p className="text-gray-600 mb-4">¿Indeciso? Llévate <span className="font-bold">{product.title}</span> con un <span className="font-bold text-green-500">{product.discount_percentage}% de descuento</span>.</p>
        <div className="my-4">
          <span className="text-gray-500 line-through">${product.price.toFixed(2)}</span>
          <span className="text-green-600 font-bold text-3xl ml-2">${discountedPrice.toFixed(2)}</span>
        </div>
        <div className="mt-6 flex flex-col space-y-3">
          <button onClick={() => { onAddToCart(product); onClose(); }} className="w-full text-center px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md">Añadir con Descuento</button>
          <button onClick={onClose} className="w-full text-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">No, gracias</button>
        </div>
      </div>
    </div>
  );
};

export default SocialStorePage;
