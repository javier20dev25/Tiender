// src/types.ts

/**
 * Representa un producto en la tienda.
 */
export interface Product {
  id: string;
  title: string; // Coincide con la columna de la DB
  price: number;
  description?: string | null;
  image_url?: string | null;
  store_id: string;
  created_at: string;
  
  // Nuevos campos para enlaces externos
  external_link?: string | null;
  video_link?: string | null;
}

/**
 * Representa una tienda.
 */
export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  user_id: string;
  created_at: string;
  trial_ends_at?: string | null;
}
