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

export type Attendance = {
  id: string;
  employee_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: { latitude: number; longitude: number } | null;
  check_out_location: { latitude: number; longitude: number } | null;
  status: string;
  date: string;
  created_at: string;
};

export type EmployeeManager = {
  id: string;
  employee_id: string;
  manager_id: string;
  created_at: string;
};

export type OvertimeRequest = {
  id: string;
  employee_id: string;
  manager_id: string;
  date: string;
  hours: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  manager_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'marriage' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: 'overtime_submitted' | 'leave_submitted' | 'overtime_approved' | 'overtime_rejected' | 'leave_approved' | 'leave_rejected' | 'overtime_cancelled' | 'leave_cancelled';
  title: string;
  content: string;
  reference_id: string | null;
  reference_type: 'overtime' | 'leave' | null;
  is_read: boolean;
  created_at: string;
};
