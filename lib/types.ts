export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image_url?: string;
  images?: string[];
  whatsapp?: string;
  user_id?: string;
  created_at?: string;
  profiles?: {
    full_name?: string;
    whatsapp?: string;
  };
};