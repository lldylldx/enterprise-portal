import { createClient } from '@/lib/supabase/server';
import OvertimeClient from './OvertimeClient';

interface OvertimeRequest {
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
}

async function getOvertimeRequests(): Promise<OvertimeRequest[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/overtime`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
}

export default async function OvertimePage() {
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

  const requests = await getOvertimeRequests();

  // Calculate total hours for current year
  const currentYear = new Date().getFullYear();
  const yearTotalHours = requests
    .filter((r) => {
      const requestYear = new Date(r.date).getFullYear();
      return requestYear === currentYear && r.status === 'approved';
    })
    .reduce((sum, r) => sum + Number(r.hours), 0);

  return (
    <OvertimeClient
      requests={requests}
      employeeName={employeeName}
      yearTotalHours={yearTotalHours}
    />
  );
}