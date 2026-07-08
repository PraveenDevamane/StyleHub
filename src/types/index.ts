export interface Category {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  subcategory: string;
  price: number;
  discounted_price: number | null;
  stock_quantity: number;
  featured: boolean;
  image_urls?: string[];
  storage_location?: string | null;
  product_code?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Included fields via joins
  categories?: {
    name: string;
  };
  product_images?: {
    image_url: string;
  }[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  action_type: string;
  created_at: string;
  products?: {
    name: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}
