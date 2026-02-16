-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PRODUCTS TABLE
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  weight numeric default 0, -- Weight in grams
  barcode text not null unique,
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDERS TABLE
create table orders (
  id uuid default uuid_generate_v4() primary key,
  items jsonb not null, -- Stores array of {product_id, quantity, price, name}
  total_amount numeric not null,
  status text not null default 'pending', -- pending, paid, verified
  payment_method text default 'UPI',
  qr_code_string text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SALES TABLE (Analytics)
create table sales (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null,
  quantity integer not null,
  selling_price numeric not null,
  cost_price numeric not null,
  total_revenue numeric not null,
  total_profit numeric not null,
  sale_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USERS TABLE (New for migration compatibility)
create table users (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  password text not null, -- Storing plain text for demo or hashed if we implement hashing
  name text not null,
  role text not null default 'customer', -- admin, security, customer
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Optional but recommended for security if exposing to frontend directly)
-- For now, we are using service role key or server-side API, so RLS might not be strictly blocked yet, 
-- but good practice to enable it and allow public read for products.

alter table products enable row level security;
create policy "Public products are viewable by everyone" on products for select using (true);
create policy "Public can insert products" on products for insert with check (true); -- For our admin demo
create policy "Public can update products" on products for update using (true);

alter table orders enable row level security;
create policy "Public orders are viewable" on orders for select using (true);
create policy "Public can insert orders" on orders for insert with check (true);
create policy "Public can update orders" on orders for update using (true);

alter table sales enable row level security;
create policy "Public sales are viewable" on sales for select using (true);
create policy "Public can insert sales" on sales for insert with check (true);

alter table users enable row level security;
create policy "Public users are viewable" on users for select using (true);
create policy "Public can insert users" on users for insert with check (true);
