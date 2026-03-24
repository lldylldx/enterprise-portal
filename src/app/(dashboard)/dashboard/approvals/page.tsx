import { createClient } from '@/lib/supabase/server';
import ApprovalsClient from './ApprovalsClient';

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

interface PendingRequest {
  id: string;
  type: 'overtime' | 'leave';
  employee_id: string;
  employee_name?: string;
  date: string;
  hours?: number;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number;
  reason: string | null;
  status: string;
  created_at: string;
}

async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    // Fetch pending overtime requests where user is manager
    const overtimeRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/overtime/pending`,
      { cache: 'no-store' }
    );
    const overtimeData = overtimeRes.ok ? await overtimeRes.json() : [];

    // Fetch pending leave requests where user is manager
    const leaveRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/leave/pending`,
      { cache: 'no-store' }
    );
    const leaveData = leaveRes.ok ? await leaveRes.json() : [];

    // Combine and sort by creation date
    const allRequests = [
      ...overtimeData.map((r: OvertimeRequest) => ({
        id: r.id,
        type: 'overtime' as const,
        employee_id: r.employee_id,
        date: r.date,
        hours: r.hours,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
      })),
      ...leaveData.map((r: LeaveRequest) => ({
        id: r.id,
        type: 'leave' as const,
        employee_id: r.employee_id,
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        total_days: r.total_days,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
      })),
    ];

    return allRequests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

async function getEmployeeNames(employeeIds: string[]): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    const uniqueIds = [...new Set(employeeIds)];
    if (uniqueIds.length === 0) return {};

    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name')
      .in('id', uniqueIds);

    if (error || !data) return {};

    return data.reduce((acc, emp) => {
      acc[emp.id] = emp.full_name || emp.id;
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
}

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let employeeName = user?.email?.split('@')[0] || '管理员';

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

  const pendingRequests = await getPendingRequests();
  const employeeIds = pendingRequests.map((r) => r.employee_id);
  const employeeNames = await getEmployeeNames(employeeIds);

  // Add employee names to requests
  const requestsWithNames = pendingRequests.map((r) => ({
    ...r,
    employee_name: employeeNames[r.employee_id] || r.employee_id,
  }));

  return (
    <ApprovalsClient
      initialRequests={requestsWithNames}
      managerName={employeeName}
    />
  );
}