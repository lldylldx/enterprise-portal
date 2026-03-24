import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // Get pending leave requests where user is the manager
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('manager_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    return NextResponse.json({ error: '获取待审批请假申请失败' }, { status: 500 });
  }
}