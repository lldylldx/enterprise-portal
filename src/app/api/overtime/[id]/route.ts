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

    // Get the overtime request
    const { data: overtimeRequest, error: fetchError } = await supabase
      .from('overtime_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !overtimeRequest) {
      return NextResponse.json({ error: '加班申请不存在' }, { status: 404 });
    }

    // Check if user is the employee (for cancellation) or manager (for approval/rejection)
    const isEmployee = overtimeRequest.employee_id === user.id;
    const isManager = overtimeRequest.manager_id === user.id;

    if (!isEmployee && !isManager) {
      return NextResponse.json({ error: '无权操作此申请' }, { status: 403 });
    }

    // Employee can only cancel pending requests
    if (isEmployee) {
      if (action !== 'cancel') {
        return NextResponse.json({ error: '员工只能取消申请' }, { status: 403 });
      }
      if (overtimeRequest.status !== 'pending') {
        return NextResponse.json({ error: '只能取消待审批的申请' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('overtime_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Notify manager about cancellation
      await supabase.from('messages').insert([
        {
          recipient_id: overtimeRequest.manager_id,
          sender_id: user.id,
          type: 'overtime_cancelled',
          title: '加班申请已取消',
          content: `员工取消了加班申请（日期：${overtimeRequest.date}，时长：${overtimeRequest.hours}小时）`,
          reference_id: id,
          reference_type: 'overtime',
        },
      ]);

      return NextResponse.json({ success: true, data });
    }

    // Manager can approve or reject
    if (isManager) {
      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
      }
      if (overtimeRequest.status !== 'pending') {
        return NextResponse.json({ error: '只能审批待审批的申请' }, { status: 400 });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      const { data, error } = await supabase
        .from('overtime_requests')
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
          recipient_id: overtimeRequest.employee_id,
          sender_id: user.id,
          type: newStatus === 'approved' ? 'overtime_approved' : 'overtime_rejected',
          title: newStatus === 'approved' ? '加班申请已批准' : '加班申请已拒绝',
          content:
            newStatus === 'approved'
              ? `您的加班申请（日期：${overtimeRequest.date}，时长：${overtimeRequest.hours}小时）已批准`
              : `您的加班申请（日期：${overtimeRequest.date}，时长：${overtimeRequest.hours}小时）已被拒绝${comment ? `，原因：${comment}` : ''}`,
          reference_id: id,
          reference_type: 'overtime',
        },
      ]);

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Error updating overtime request:', error);
    return NextResponse.json({ error: '更新加班申请失败' }, { status: 500 });
  }
}