/*
# Create products table for POS Sales Calculator

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name e.g. "Indomie Carton"
  - `price` (numeric, not null, default 0) — selling price in Naira
  - `stock` (integer, not null, default 0) — quantity in stock
  - `category` (text, nullable) — optional category e.g. "Food", "Drinks"
  - `created_at` (timestamptz, default now())
  - `user_id` (uuid, not null, default auth.uid()) — owner

2. Security
- Enable RLS on `products`.
- Owner-scoped CRUD: each authenticated user can only access their own products.
- 4 separate policies (select/insert/update/delete) scoped to `TO authenticated`.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  category text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
