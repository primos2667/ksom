import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table: products
// Columns needed in Supabase SQL:
// create table products (
//   id uuid default gen_random_uuid() primary key,
//   title text not null,
//   price text not null,
//   category text not null,
//   location text not null,
//   whatsapp text not null,
//   image_url text,
//   created_at timestamp default now(),
//   seller_id uuid
// );