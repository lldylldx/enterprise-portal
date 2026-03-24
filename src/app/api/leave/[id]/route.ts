import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, comment } = body;

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json({ error: '请假申请不存在' }, { status: 404 });
    }

    // Check if user is the employee (for cancellation) or manager (for approval/rejection)
    const isEmployee = leaveRequest.employee_id === user.id;
    const isManager = leaveRequest.manager_id === user.id;

    if (!isEmployee && !isManager) {
      return NextResponse.json({ error: '无权操作此申请' }, { status: 403 });
    }

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

    // Employee can only cancel pending requests
    if (isEmployee) {
      if (action !== 'cancel') {
        return NextResponse.json({ error: '员工只能取消申请' }, { status: 403 });
      }
      if (leaveRequest.status !== 'pending') {
        return NextResponse.json({ error: '只能取消待审批的申请' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Notify manager about cancellation
      await supabase.from('messages').insert([
        {
          recipient_id: leaveRequest.manager_id,
          sender_id: user.id,
          type: 'leave_cancelled',
          title: '请假申请已取消',
          content: `员工取消了${leaveTypeNames[leaveRequest.leave_type] || '请假'}申请（${leaveRequest.start_date}至${leaveRequest.end_date}，共${leaveRequest.total_days}天）`,
          reference_id: id,
          reference_type: 'leave',
        },
      ]);

      return NextResponse.json({ success: true, data });
    }

    // Manager can approve or reject
    if (isManager) {
      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
      }
      if (leaveRequest.status !== 'pending') {
        return NextResponse.json({ error: '只能审批待审批的申请' }, { status: 400 });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          manager_comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Notify employee about the decision
      await supabase.from('messages').insert([
        {
          recipient_id: leaveRequest.employee_id,
          sender_id: user.id,
          type: newStatus === 'approved' ? 'leave_approved' : 'leave_rejected',
          title: newStatus === 'approved' ? '请假申请已批准' : '请假申请已拒绝',
          content:
            newStatus === 'approved'
              ? `您的${leaveTypeNames[leaveRequest.leave_type] || '请假'}申请（${leaveRequest.start_date}至${leaveRequest.end_date}，共${leaveRequest.total_days}天）已批准`
              : `您的${leaveTypeNames[leaveRequest.leave_type] || '请假'}申请（${leaveRequest.start_date}至${leaveRequest.end_date}，共${leaveRequest.total_days}天）已被拒绝${comment ? `，原因：${comment}` : ''}`,
          reference_id: id,
          reference_type: 'leave',
        },
      ]);

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json({ error: '更新请假申请失败' }, { status: 500 });
  }
}