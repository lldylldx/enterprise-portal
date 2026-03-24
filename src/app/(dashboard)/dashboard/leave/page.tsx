import { createClient } from '@/lib/supabase/server';
import LeaveClient from './LeaveClient';

interface LeaveRequest {
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
}

async function getLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/leave`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
}

export default async function LeavePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let employeeName = user?.email?.split('@')[0] || '员工';

  if (user) {
    const { data: employee } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (employee?.full_name) {
      employeeName = employee.full_name;
    }
  }

  const requests = await getLeaveRequests();

  // Calculate total days for current year
  const currentYear = new Date().getFullYear();
  const yearTotalDays = requests
    .filter((r) => {
      const requestYear = new Date(r.start_date).getFullYear();
      return requestYear === currentYear && r.status === 'approved';
    })
    .reduce((sum, r) => sum + r.total_days, 0);

  return (
    <LeaveClient
      requests={requests}
      employeeName={employeeName}
      yearTotalDays={yearTotalDays}
    />
  );
}