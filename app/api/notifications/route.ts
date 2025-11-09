import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('🔔 GET /api/notifications - Fetching user notifications');

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('❌ Authentication failed');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, unread, read
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filter
    if (filter === 'unread') {
      query = query.eq('is_read', false);
    } else if (filter === 'read') {
      query = query.eq('is_read', true);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
    }

    const unreadCount = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false);

    console.log('✅ Notifications fetched successfully:', notifications?.length || 0);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount.count || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔔 POST /api/notifications - Creating notification');

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('❌ Authentication failed');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Check if user is admin or agent (only they can create notifications for others)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'agent'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Sin permisos para crear notificaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 'medium',
      action_url,
    } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: user_id, title, message' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        category,
        priority,
        action_url,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
    }

    console.log('✅ Notification created successfully:', notification.id);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('❌ Error in POST /api/notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  console.log('🔔 PATCH /api/notifications - Updating notifications');

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('❌ Authentication failed');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, notification_id } = body;

    if (action === 'mark_as_read') {
      const updateData: any = { is_read: true, read_at: new Date().toISOString() };

      let query = supabase.from('notifications').update(updateData).eq('user_id', user.id);

      if (notification_id) {
        // Mark specific notification as read
        query = query.eq('id', notification_id);
      } else {
        // Mark all unread notifications as read
        query = query.eq('is_read', false);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 });
      }

      console.log('✅ Notifications marked as read successfully');

      return NextResponse.json({ success: true });
    } else if (action === 'delete') {
      if (!notification_id) {
        return NextResponse.json(
          { error: 'notification_id es requerido para eliminar' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification_id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error deleting notification:', error);
        return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500 });
      }

      console.log('✅ Notification deleted successfully');

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
