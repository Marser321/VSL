import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await insforge.database
      .from('vsl_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ queue: data || [] });
  } catch (error: any) {
    console.error('[API/queue]', error.message);
    return NextResponse.json({ error: 'Error recargando la cola' }, { status: 500 });
  }
}
