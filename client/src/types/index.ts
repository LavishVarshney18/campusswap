export type ListingCategory = 'book' | 'notes' | 'calculator' | 'lab-equipment' | 'other';
export type ListingMode = 'sell' | 'rent' | 'swap';
export type ListingCondition = 'new' | 'good' | 'fair';
export type ListingStatus = 'available' | 'sold' | 'rented' | 'swapped' | 'closed';

export interface User {
  id: number;
  name: string;
  email: string;
  hostel: string;
  batch: string;
  created_at?: string;
}

export interface Listing {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  category: ListingCategory;
  course?: string | null;
  semester?: string | null;
  condition: ListingCondition;
  mode: ListingMode;
  price?: number | null;
  rent_price_per_week?: number | null;
  swap_wanted?: string | null;
  status: ListingStatus;
  created_at: string;
  seller_name?: string;
  seller_hostel?: string;
  seller_batch?: string;
  has_transactions?: boolean | number;
}

export interface RequestItem {
  id: number;
  user_id: number;
  title: string;
  course?: string | null;
  semester?: string | null;
  note?: string | null;
  status: 'open' | 'fulfilled' | 'closed';
  created_at: string;
  user_name?: string;
  hostel?: string;
  batch?: string;
  user_email?: string;
}

export interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  type: 'sale' | 'rent' | 'swap';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  due_date?: string | null;
  created_at: string;
  listing_title?: string;
  seller_email?: string;
  seller_name?: string;
  buyer_name?: string;
}

export interface Stats {
  totalListings: number;
  openRequests: number;
  completedTransactions: number;
}
