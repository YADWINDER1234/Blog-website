import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  total_seats: number;
  available_seats: number;
  image_url: string;
  price: number;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  event_id: string;
  seats_booked: number;
  booking_status: 'confirmed' | 'cancelled';
  created_at: string;
  events?: Event;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
};
