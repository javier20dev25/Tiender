# Spec: Onboarding de Vendedores y Publicación de Productos

## 1. Overview
This track covers the foundational user journey for sellers. The goal is to allow a new user to sign up, create a store, and publish their first product. This is the core loop for activating the supply side of the marketplace.

## 2. User Stories
- **As a new user,** I can sign up for an account using my email and a password.
- **As a logged-in user,** I can create my store profile by providing a store name, a logo image, and my WhatsApp number.
- **As a store owner,** I can access a simple dashboard to see and manage my products.
- **As a store owner,** I can upload a new product by providing a title, a price, and a single product image.
- **As a store owner,** I can see a list of my uploaded products on my dashboard.
- **As a store owner,** I expect the product image I upload to be automatically compressed and optimized to ensure a fast experience for buyers.

## 3. Technical Requirements
- **Authentication:** Use Supabase Auth for user registration and management.
- **Database:**
    - Create a `stores` table to hold store profiles. It must be linked to a user ID.
    - Create a `products` table to hold product data. It must be linked to a store ID.
- **Security:**
    - Implement Row Level Security (RLS) on the `stores` and `products` tables to ensure owners can only see and manage their own data.
- **File Storage:**
    - Use Supabase Storage to host store logos and product images.
    - Create an Edge Function to handle image optimization upon upload. The function should trigger on new objects in the storage bucket.
- **UI/UX:**
    - All forms (signup, store creation, product upload) must be simple, clean, and follow the brand guidelines.
    - The seller dashboard should present a clean list of products.
