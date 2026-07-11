export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface CategoryWithStats extends Category {
  image_count: number;
  preview_image: string | null;
}

export interface GalleryImage {
  id: string;
  category_id: string;
  title: string;
  image_url: string;
  created_at: string;
  categories?: { name: string };
}

export interface Service {
  id: string;
  title: string;
  short_description?: string;
  icon?: string;
  image_url?: string;
  created_at?: string;
}

export interface Package {
  id: string;
  name: string;
  price: string;
  description?: string;
  features: string[];
  display_order?: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface WebsiteSettings {
  id?: number | string;
  business_name?: string;
  tagline?: string;
  about_description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  logo_url?: string;
  hero_image?: string;
  favicon_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  name: string;
  designation?: string;
  image_url?: string;
  text: string;
  rating: number;
  featured?: boolean;
  display_order?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}
