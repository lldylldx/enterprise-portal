import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: '获取请假申请失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { leave_type, start_date, end_date, total_days, reason } = body;

    if (!leave_type || !start_date || !end_date || !total_days) {
      return NextResponse.json({ error: '请假类型、开始日期、结束日期和天数不能为空' }, { status: 400 });
    }

    if (total_days <= 0) {
      return NextResponse.json({ error: '请假天数必须大于0' }, { status: 400 });
    }

    // Get employee's manager
    const { data: managerRelation, error: managerError } = await supabase
      .from('employee_managers')
      .select('manager_id')
      .eq('employee_id', user.id)
      .single();

    if (managerError || !managerRelation) {
      return NextResponse.json({ error: '未找到员工的直接主管' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert([
        {
          employee_id: user.id,
          manager_id: managerRelation.manager_id,
          leave_type,
          start_date,
          end_date,
          total_days,
          reason: reason || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create notification message for manager
    const { data: employee } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const leaveTypeNames: Record<string, string> = {
      annual: '年假',
      sick: '病假',
      personal: '事假',
      marriage: '婚假',
      maternity: '产假',
      paternity: '陪产假',
      bereavement: '丧假',
      other: '其他',
    };

    await supabase.from('messages').insert([
      {
        recipient_id: managerRelation.manager_id,
        sender_id: user.id,
        type: 'leave_submitted',
        title: '新的请假申请',
        content: `员工 ${employee?.full_name || '未知' } 提交了${leaveTypeNames[leave_type] || leave_type}申请，日期：${start_date}至${end_date}，共${total_days}天`,
        reference_id: data.id,
        reference_type: 'leave',
      },
    ]);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: '创建请假申请失败' }, { status: 500 });
  }
}