import { createClient } from '@supabase/supabase-js';

// Use placeholder values if environment variables are not set
const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌  Supabase env vars are missing. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Types for our database
export interface UserProfile {
  id: string;
  account_name: string | null;
  payment_info: string | null;
  created_at?: string;
}

export interface Receipt {
  id: string;
  owner: string;
  vendor: string | null;
  total: number | null;
  image_url: string | null;
  json_items: any;
  json_participants: any;
  created_at?: string;
}

export interface ReceiptItem {
  text: string;
  price: number;
  assigned_to?: string[];
  is_shared?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  contact_info?: string;
  total_amount?: number;
}