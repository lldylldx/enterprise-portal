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

    // Get the employee's manager
    const { data: managerRelation, error: managerError } = await supabase
      .from('employee_managers')
      .select('*')
      .eq('employee_id', user.id)
      .single();

    if (managerError || !managerRelation) {
      return NextResponse.json(null);
    }

    // Get manager details
    const { data: manager, error: managerDetailsError } = await supabase
      .from('employees')
      .select('id, full_name, email, department, position, avatar_url')
      .eq('id', managerRelation.manager_id)
      .single();

    if (managerDetailsError) {
      return NextResponse.json({ manager_id: managerRelation.manager_id });
    }

    return NextResponse.json({
      ...managerRelation,
      manager,
    });
  } catch (error) {
    console.error('Error fetching employee manager:', error);
    return NextResponse.json({ error: '获取经理信息失败' }, { status: 500 });
  }
}