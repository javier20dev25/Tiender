import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';

export function useProducts(storeId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchProducts = useCallback(async (id: string) => {
    // Avoid redundant state updates
    setLoadingProducts(true);
    try {
      const { data: productsData, error: productsError } = await getSupabase()
        .from('products')
        .select('id, title, price, description, image_url, store_id, created_at, external_link, video_link, is_hot, discount_percentage, discount_timer_seconds, wholesale_price, wholesale_threshold')
        .eq('store_id', id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('[useProducts] Error fetching products:', productsError);
      } else {
        setProducts(productsData || []);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchProducts(storeId);
    }
  }, [storeId, fetchProducts]);

  return { products, loadingProducts, fetchProducts };
}
