// src/types.ts

/**
 * Representa un producto en la tienda.
 */
export interface Product {
  id: string;
  title: string; // Coincide con la columna de la DB
  price: number;
  description: string | null;
  image_url: string | null;
  store_id: string;
  created_at: string;

  // Nuevos campos para enlaces externos
  external_link: string | null;
  video_link: string | null;

  // Nuevos campos para Plan Full
  hashtags?: string[] | null;
  is_hot?: boolean;

  // Oferta por inactividad
  discount_timer_seconds?: number | null;
  discount_percentage?: number | null;

  // Ventas al por Mayor
  wholesale_threshold?: number | null;
  wholesale_price?: number | null;
}

/**
 * Representa una tienda.
 */
export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  whatsapp_number: string | null;
  user_id: string;
  created_at: string;
  trial_ends_at: string | null;
  plan_type: string;
  community_link: string | null;
  product_limit?: number;
}

export interface HeatmapData {
  hour: string;
  visits: number;
  adds_to_cart: number;
}

export interface ProductAnalyticsSummary {
  id: string;
  title: string;
  image_url: string | null;
  total_added_to_cart: number;
}

export interface WeeklyAnalyticsData {
  heatmap_data: HeatmapData[];
  product_summary: ProductAnalyticsSummary[];
  total_summary: {
    total_visits: number;
    total_adds_to_cart: number;
  };
}

export type CartItem = Product & { quantity: number; final_price?: number };
