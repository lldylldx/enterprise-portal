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

    // Get pending overtime requests where user is the manager
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*')
      .eq('manager_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching pending overtime requests:', error);
    return NextResponse.json({ error: '获取待审批加班申请失败' }, { status: 500 });
  }
}