import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  display_order: number;
  created_at: string;
};

export type Service = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  content: string | null;
  display_order: number;
  created_at: string;
};

export type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  cover_image: string | null;
  client: string | null;
  completed_at: string | null;
  display_order: number;
  created_at: string;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  created_at: string;
};

export type Employee = {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
  created_at: string;
};
