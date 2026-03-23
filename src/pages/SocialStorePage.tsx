import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, ShoppingCart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import type { Store, Product } from '../types';
import { Perf } from '../utils/perf';

// --- Types ---
type CartItem = Product & { quantity: number };
type VerificationStatus = 'pending' | 'verified' | 'failed';

// --- Components ---
const DiscountTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  // Update when seconds changes with a check
  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  if (timeLeft === 0) return null;
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
      ⏳ {mins}:{secs}
    </span>
  );
};

const ImageWithPlaceholder: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-gray-200" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const SocialStorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();

  // --- State Management ---
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [visitToken, setVisitToken] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const hasLoggedVisit = useRef(false);

  // Motion values for swipe effect
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const secondaryOpacity = useTransform(x, [-150, -50], [1, 0]);

  // --- API Calls ---
  const logEvent = useCallback(async (eventType: 'VISIT' | 'LIKE' | 'DISLIKE' | 'ADD_TO_CART') => {
    if (!storeId || !visitToken) return;
    const isProductEvent = eventType !== 'VISIT';
    const currentProductId = products[currentIndex]?.id;
    if (isProductEvent && !currentProductId) return;

    try {
      await getSupabase().functions.invoke('record-verified-event', {
        headers: { Authorization: `Bearer ${visitToken}` },
        body: {
          event_type: eventType,
          product_id: isProductEvent ? currentProductId : undefined,
        }
      });
    } catch (err) {
      console.error('Error logging verified event:', err);
    }
  }, [storeId, visitToken, currentIndex, products]);

  const fetchStoreAndProducts = useCallback(async (currentStoreId: string) => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const query = getSupabase().from('stores').select('*');
      
      if (uuidRegex.test(currentStoreId)) {
        query.eq('id', currentStoreId);
      } else {
        query.eq('slug', currentStoreId);
      }

      const { data: storeData, error: storeError } = await query.single();
      if (storeError || !storeData) throw new Error('No se pudo cargar la tienda.');
      setStore(storeData);

      const { data: productsData, error: productsError } = await getSupabase()
        .rpc('get_store_products', { target_store_id: storeData.id });
      if (productsError) throw new Error('No se pudieron cargar los productos.');
      setProducts(productsData || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión. Revisa tu internet.';
      console.error('Fetch error:', err);
      setError(message);
    }
  }, []);

  const verifyAndFetch = useCallback(async () => {
    if (!storeId) return;
    Perf.start('SocialStorePage_Load');
    setError('');
    setIsRetrying(true);
    
    // Start fetching data and verifying visit in parallel
    const dataPromise = fetchStoreAndProducts(storeId);
    
    try {
      const { data, error } = await getSupabase().functions.invoke('visit-gate', {
        body: { store_id: storeId },
      });
      if (error) throw error;
      setVisitToken(data.visit_token);
      setVerificationStatus('verified');
    } catch (err) {
      console.error('Verification failed:', err);
      setVerificationStatus('failed');
      setError("Acceso denegado. La visita ha sido marcada como sospechosa.");
    } finally {
      await dataPromise; // Ensure we finish both
      setIsRetrying(false);
      Perf.end('SocialStorePage_Load');
    }
  }, [storeId, fetchStoreAndProducts]);

  useEffect(() => {
    verifyAndFetch();
  }, [verifyAndFetch]);

  // Log initial visit when token and products are ready
  useEffect(() => {
    if (verificationStatus === 'verified' && visitToken && products.length > 0 && !hasLoggedVisit.current) {
      logEvent('VISIT');
      hasLoggedVisit.current = true;
    }
  }, [verificationStatus, visitToken, products.length, logEvent]);

  // Preload next image
  useEffect(() => {
    if (products.length > 0) {
      const nextIdx = (currentIndex + 1) % products.length;
      const nextImg = products[nextIdx]?.image_url;
      if (nextImg) {
        const img = new Image();
        img.src = nextImg;
      }
    }
  }, [currentIndex, products]);

  // --- Event Handlers ---
  const handleNextProduct = (type: 'LIKE' | 'DISLIKE') => {
    if (products.length <= 1) {
      x.set(0);
      return;
    }
    Perf.start('ProductSwipe');
    logEvent(type);
    setCurrentIndex(prev => (prev + 1) % products.length);
    x.set(0);
    Perf.end('ProductSwipe');
  };

  const handleAddToCart = () => {
    Perf.start('CartAdd');
    const currentProduct = products[currentIndex];
    if (!currentProduct) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === currentProduct.id);
      if (existing) {
        return prev.map(item => item.id === currentProduct.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...currentProduct, quantity: 1 }];
    });
    logEvent('ADD_TO_CART');
    Perf.end('CartAdd');
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQuantity = newCart[index].quantity + delta;
      if (newQuantity <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index].quantity = newQuantity;
      }
      return newCart;
    });
  };

  const getProductPrice = (product: Product) => {
    if (product.discount_percentage) {
      return product.price * (1 - product.discount_percentage / 100);
    }
    return product.price;
  };

  const getCartItemPrice = (item: CartItem) => {
    if (item.wholesale_threshold && item.quantity >= item.wholesale_threshold && item.wholesale_price) {
      return item.wholesale_price;
    }
    return getProductPrice(item);
  };

  if (verificationStatus === 'pending' || (isRetrying && !store)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-pink/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 font-display text-gray-400 font-medium animate-pulse">Optimizando tu experiencia...</p>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-6 text-center bg-gray-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 max-w-sm"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">¡Ups! Algo pasó</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={verifyAndFetch}
            className="w-full py-4 bg-brand-dark text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Intentar de nuevo
          </button>
        </motion.div>
      </div>
    );
  }

  if (!store) return null;

  const currentProduct = products[currentIndex];
  const nextProduct = products[(currentIndex + 1) % products.length];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 selection:bg-brand-pink/20 pb-24">
      <header className="px-6 pt-8 pb-4 flex flex-col items-center sticky top-0 bg-[#FAFAFA]/80 backdrop-blur-md z-40">
        {store.logo_url && (
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-sunset-gradient rounded-full blur-md opacity-20"></div>
            <img src={store.logo_url} alt="Logo" className="relative h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-center">{store.name}</h1>
        {store.community_link && (
          <a href={store.community_link} target="_blank" rel="noreferrer" className="mt-2 text-sm text-brand-pink font-semibold hover:underline">
            Unirse a la Comunidad
          </a>
        )}
      </header>

      <main className="px-4 max-w-lg mx-auto mt-4 relative">
        {products.length > 0 && currentProduct ? (
          <div className="relative h-[65vh] w-full">
            {/* Next Card (The Stack Effect) */}
            <AnimatePresence>
              {nextProduct && products.length > 1 && (
                <div className="absolute inset-0 scale-[0.94] translate-y-4 opacity-50 grayscale-[0.5] pointer-events-none">
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden h-full">
                    <img src={nextProduct.image_url || 'https://placehold.co/600x600'} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Current Card */}
            <motion.div
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleNextProduct('LIKE');
                else if (info.offset.x < -100) handleNextProduct('DISLIKE');
              }}
              className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full relative group">
                <ImageWithPlaceholder
                  src={currentProduct.image_url || 'https://placehold.co/600x600'}
                  alt={currentProduct.title}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                />

                {/* Visual Feedback Seals */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 z-20 border-4 border-brand-neon px-4 py-2 rounded-xl -rotate-12 pointer-events-none">
                  <span className="text-brand-neon font-display text-4xl font-bold tracking-tighter uppercase">Me gusta</span>
                </motion.div>
                <motion.div style={{ opacity: secondaryOpacity }} className="absolute top-10 right-10 z-20 border-4 border-brand-pink px-4 py-2 rounded-xl rotate-12 pointer-events-none">
                  <span className="text-brand-pink font-display text-4xl font-bold tracking-tighter uppercase">Siguiente</span>
                </motion.div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
                  <div className="flex flex-col gap-2 mb-2">
                    {/* Badges row */}
                    {(currentProduct.is_hot || currentProduct.discount_percentage || currentProduct.discount_timer_seconds) && (
                      <div className="flex flex-wrap gap-2">
                        {currentProduct.is_hot && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">🔥 Hot</span>}
                        {currentProduct.discount_percentage && <span className="bg-brand-pink text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">{currentProduct.discount_percentage}% OFF</span>}
                        {currentProduct.discount_timer_seconds && <DiscountTimer seconds={currentProduct.discount_timer_seconds} />}
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <div className="max-w-[65%]">
                        <h2 className="text-2xl font-bold text-white leading-tight mb-1">{currentProduct.title}</h2>
                        <p className="text-white/70 text-sm line-clamp-2 font-medium">{currentProduct.description}</p>
                      </div>
                      <div className="text-right">
                        {currentProduct.discount_percentage ? (
                           <>
                             <span className="block text-sm font-medium text-white/50 line-through mb-0.5">${currentProduct.price.toFixed(2)}</span>
                             <span className="block text-2xl font-bold text-brand-neon mb-1">${getProductPrice(currentProduct).toFixed(2)}</span>
                           </>
                        ) : (
                           <span className="block text-2xl font-bold text-brand-neon mb-1">${currentProduct.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Links Row */}
                  {(currentProduct.external_link || currentProduct.video_link) && (
                    <div className="flex gap-2 mt-4">
                      {currentProduct.external_link && (
                        <a href={currentProduct.external_link.startsWith('http') ? currentProduct.external_link : `https://${currentProduct.external_link}`} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2.5 rounded-xl text-center text-sm font-bold transition-colors">
                          Ver en Tienda
                        </a>
                      )}
                      {currentProduct.video_link && (
                        <a href={currentProduct.video_link.startsWith('http') ? currentProduct.video_link : `https://${currentProduct.video_link}`} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2.5 rounded-xl text-center text-sm font-bold transition-colors">
                          Video Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 italic text-gray-400">
            Pronto tendremos nuevos productos para ti.
          </div>
        )}

        {/* Interaction Controls */}
        <div className="flex justify-center items-center gap-6 mt-10">
          <button
            onClick={() => handleNextProduct('DISLIKE')}
            aria-label="Siguiente producto"
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-brand-pink hover:scale-110 active:scale-95 transition-all border border-gray-100"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={products.length === 0}
            className="h-16 px-8 rounded-full bg-brand-dark text-white font-bold shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:scale-100"
          >
            <ShoppingCart className="w-6 h-6 group-hover:animate-bounce" />
            <span>Añadir</span>
          </button>
          <button
            onClick={() => handleNextProduct('LIKE')}
            aria-label="Me gusta"
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-brand-neon hover:scale-110 active:scale-95 transition-all border border-gray-100"
          >
            <Heart className="w-8 h-8" />
          </button>
        </div>
      </main>

      {/* Floating Cart Launcher */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 inset-x-0 px-6 flex justify-center z-50"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="sunset-button px-8 py-4 rounded-full flex items-center gap-3 animate-pulse active:animate-none"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Ver mi pedido ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl p-8 pt-10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full sm:hidden"></div>

              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold tracking-tight">Tu Pedido</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-6 pr-2 mb-8 scroll-smooth">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-white">
                      <img src={item.image_url || 'https://placehold.co/100x100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-[15px] leading-tight mb-1">{item.title}</h4>
                      <div className="flex flex-col mb-2">
                        <span className="text-brand-dark font-bold">${getCartItemPrice(item).toFixed(2)}</span>
                        {item.wholesale_threshold && item.quantity >= item.wholesale_threshold && item.wholesale_price && (
                           <span className="text-[10px] font-bold text-brand-pink uppercase tracking-wider">Mayorista Activado</span>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full w-fit p-1 shadow-sm">
                        <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center font-black text-gray-500 hover:bg-gray-100 transition-colors">-</button>
                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center font-black text-gray-500 hover:bg-gray-100 transition-colors">+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                      className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-start mt-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <div>
                     <span className="block text-sm text-gray-400 font-bold mb-1">TOTAL</span>
                     <span className="text-xl font-bold tracking-tight text-gray-900">{cart.reduce((sum, item) => sum + item.quantity, 0)} artículos</span>
                  </div>
                  <span className="text-4xl font-black text-brand-pink tracking-tight">${cart.reduce((sum, item) => sum + (getCartItemPrice(item) * item.quantity), 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  // Simulate a short delay to prevent accidental double-clicks and show feedback
                  setTimeout(() => {
                    const items = cart.map(i => `${i.title} (x${i.quantity})`).join(', ');
                    const total = cart.reduce((sum, item) => sum + (getCartItemPrice(item) * item.quantity), 0).toFixed(2);
                    const message = encodeURIComponent(`¡Hola! Me gustaría comprar: ${items}. Total: $${total}`);
                    window.open(`https://wa.me/${store.whatsapp_number}?text=${message}`, '_blank');
                    setIsCartOpen(false);
                    setIsSubmitting(false);
                  }, 1500);
                }}
                disabled={isSubmitting}
                className={`w-full py-5 ${isSubmitting ? 'bg-zinc-200 text-zinc-400' : 'bg-brand-neon text-brand-dark hover:scale-[1.02] active:scale-[0.98]'} font-black text-xl rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3`}
              >
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-4 border-zinc-400 border-t-transparent rounded-full" />
                ) : (
                  <ShoppingBag className="w-6 h-6" />
                )}
                <span>{isSubmitting ? 'Procesando...' : 'Finalizar por WhatsApp'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="text-center mt-12 mb-8">
        <p className="text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
          Desarrollado con <Heart className="w-3 h-3 text-brand-pink fill-brand-pink" /> por
          <a href="/" className="text-gray-600 hover:text-brand-pink transition-colors underline decoration-brand-pink/20 underline-offset-4">Tiender</a>
        </p>
      </footer>
    </div>
  );
};

export default SocialStorePage;
