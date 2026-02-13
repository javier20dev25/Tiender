// src/pages/SocialStorePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import type { Store, Product } from '../types';

// --- Types ---
type CartItem = Product & { quantity: number; final_price?: number };
type VerificationStatus = 'pending' | 'verified' | 'failed';

// --- Main Component ---
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
  const hasLoggedVisit = useRef(false);

  // --- API Calls ---

  // 1. Log event securely using the visit token
  const logEvent = useCallback(async (eventType: 'VISIT' | 'LIKE' | 'DISLIKE' | 'ADD_TO_CART') => {
    if (!storeId || !visitToken) return; // Don't log if not verified
    
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
    } catch (error) {
      console.error('Error logging verified event:', error);
    }
  }, [storeId, visitToken, currentIndex, products]);

  // 2. Fetch store and product data (only after verification)
  const fetchStoreAndProducts = useCallback(async () => {
    if (!storeId) return;
    setError('');

    try {
      const { data: storeData, error: storeError } = await getSupabase()
        .from('stores').select('*').eq('id', storeId).single();
      if (storeError) throw new Error('No se pudo cargar la tienda.');
      setStore(storeData);

      const { data: productsData, error: productsError } = await getSupabase()
        .rpc('get_store_products', { target_store_id: storeData.id });
      if (productsError) throw new Error('No se pudieron cargar los productos.');
      setProducts(productsData || []);

      if (!hasLoggedVisit.current) {
        logEvent('VISIT');
        hasLoggedVisit.current = true;
      }

    } catch (error: unknown) {
        setError('No se pudo cargar la tienda. Inténtalo de nuevo.');
      }
  }, [storeId, logEvent]);
  
  // --- Effects ---

  // Main effect: On mount, call visit-gate, then fetch data if successful
  useEffect(() => {
    if (!storeId) {
        setVerificationStatus('failed');
        setError("No se ha especificado una tienda.");
        return;
    }
    
    const verifyVisit = async () => {
      try {
        const { data, error } = await getSupabase().functions.invoke('visit-gate', {
          body: { store_id: storeId },
        });

        if (error) throw error;

        setVisitToken(data.visit_token);
        setVerificationStatus('verified');
      } catch (err) {
        console.error("Verification failed:", err);
        setVerificationStatus('failed');
        setError("Acceso denegado. La visita ha sido marcada como sospechosa.");
      }
    };
    
    verifyVisit();
  }, [storeId]);

  // Fetch content only after verification is successful
  useEffect(() => {
    if (verificationStatus === 'verified') {
      fetchStoreAndProducts();
    }
  }, [verificationStatus, fetchStoreAndProducts]);


  // --- Render Logic ---
  if (verificationStatus === 'pending') {
    return <div className="flex justify-center items-center min-h-screen">Verificando visita...</div>;
  }
  
  if (verificationStatus === 'failed' || error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }
  
  if (!store) {
    return <div className="flex justify-center items-center min-h-screen">Cargando tienda...</div>;
  }
  
  // --- Rest of the component logic (event handlers, etc.) ---
  const handleNextProduct = () => setCurrentIndex(prev => (prev + 1) % products.length);
  const handleAddToCart = () => {
      const currentProduct = products[currentIndex];
      if (!currentProduct) return;
      // ... (cart logic remains the same)
      logEvent('ADD_TO_CART');
  };
  const handleLike = () => {
      if (!products[currentIndex]) return;
      logEvent('LIKE');
      // ... (ui logic remains the same)
      handleNextProduct();
  };
  const handleDislike = () => {
      if (!products[currentIndex]) return;
      logEvent('DISLIKE');
      // ... (ui logic remains the same)
      handleNextProduct();
  };

  // The rest of the component's render method and sub-components can stay largely the same,
  // as they only activate after the data is successfully fetched.
  // We'll just put a placeholder here for brevity, assuming the rest of the UI code is appended.
  const currentProduct = products[currentIndex];
  
  return (
    <div className="container mx-auto p-4 max-w-lg">
      <header className="text-center mb-6">
        {store.logo_url && <img src={store.logo_url} alt="Logo" className="mx-auto h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />}
        <h1 className="text-4xl font-bold text-gray-800">{store.name}</h1>
      </header>
       {products.length > 0 && currentProduct ? (
         <div className="relative">
           {/* ... All the product swiping and button UI ... */}
           <div className="relative z-10 flex justify-around items-center">
             {/* ... Swiping buttons ... */}
             <button onClick={handleDislike} className={`p-4 rounded-full shadow-lg text-3xl bg-white text-red-500`}>❌</button>
             <button onClick={handleLike} className={`p-4 rounded-full shadow-lg text-3xl bg-white text-green-500`}>❤️</button>
             {/* ... More buttons ... */}
           </div>
         </div>
       ) : <p className="text-center text-gray-500 py-20">¡Esta tienda aún no tiene productos!</p>}
       {/* ... Modals and Footer ... */}
       <footer className="text-center mt-8 py-4"><a href="/" className="text-sm text-gray-500 hover:text-gray-700">Crea tu tienda con Tiender</a></footer>
     </div>
  );
};

export default SocialStorePage;
