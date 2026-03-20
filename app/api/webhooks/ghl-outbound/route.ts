import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: NextRequest) {
  try {
    const { queueId, contactId, vslPayload } = await req.json();

    if (!queueId || !contactId || !vslPayload) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Actualizamos el estado en nuestra DB (Insforge) a "approved"
    const { error: dbError } = await insforge.database
      .from('vsl_queue')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', queueId);

    if (dbError) {
      console.error('[Webhooks/Outbound] Error actualizando estado:', dbError);
    }

    // 2. Enviamos el VSL terminado al Inbound Webhook de GHL.
    // REEMPLAZÁ ESTA URL por la URL real de tu Inbound Webhook de GHL.
    const GHL_WEBHOOK_URL = process.env.GHL_INBOUND_WEBHOOK_URL;
    
    if (GHL_WEBHOOK_URL) {
      const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contactId,
          vsl_script_completo: JSON.stringify(vslPayload.bloques),
          vsl_hooks: JSON.stringify(vslPayload.hooks),
          status: 'vsl_generado'
        })
      });

      if (!ghlResponse.ok) {
        console.error('[Webhooks/Outbound] Error enviando a GHL:', await ghlResponse.text());
      }
    } else {
      console.warn('[Webhooks/Outbound] No se configuró GHL_INBOUND_WEBHOOK_URL en .env.local');
    }

    return NextResponse.json({ success: true, message: 'VSL Exportado Exitosamente' });
  } catch (error) {
    console.error('[Webhooks/Outbound] Error:', error);
    return NextResponse.json({ error: 'Error exportando el VSL' }, { status: 500 });
  }
}
