import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Extraemos los datos comunes que envía GHL o creamos defaults
    const contactId = payload.contact_id || payload.id || `temp_${Date.now()}`;
    const nombre = payload.first_name || payload.name || 'Cliente sin nombre';
    const email = payload.email || '';
    
    // Mapeamos los Custom Fields al formato que espera VSL Editor
    // Ajustá las keys (payload.xxx) de acuerdo a cómo las mande tu Workflow en GHL
    const datosCliente = {
      nombreNegocio: payload.customData?.nombre_negocio || payload.nombre_negocio || payload.companyName || 'Negocio Desconocido',
      avatarObjetivo: payload.customData?.avatar_objetivo || payload.avatar_objetivo || 'Público general',
      problemasPrincipal: payload.customData?.problema_principal || payload.problema_principal || 'Problemas operativos',
      zonaGeografica: payload.customData?.zona_geografica || payload.zona_geografica || payload.city || 'Local',
      propuestaUnica: payload.customData?.propuesta_unica || payload.propuesta_unica || '',
      granPromesa: payload.customData?.gran_promesa || payload.gran_promesa || '',
      garantia: payload.customData?.garantia || payload.garantia || '',
      tonoComunicacion: payload.customData?.tono_comunicacion || payload.tono_comunicacion || '',
      quejasComunes: payload.customData?.quejas_comunes || payload.quejas_comunes || '',
      competidoresInfo: payload.customData?.competidores_info || payload.competidores_info || '',
      pruebaSocial: payload.customData?.prueba_social || payload.prueba_social || ''
    };

    // Insertamos en la cola
    const { data, error } = await insforge.database
      .from('vsl_queue')
      .insert([{
        contact_id: contactId,
        nombre,
        email,
        datos_cliente: datosCliente,
        status: 'pending'
      }]);

    if (error) {
      console.error('[Webhooks/Inbound] Error insertando en DB:', error);
      return NextResponse.json({ error: 'Error guardando en la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Agregado a la cola VSL' });
  } catch (error) {
    console.error('[Webhooks/Inbound] Error:', error);
    return NextResponse.json({ error: 'Error procesando el webhook' }, { status: 500 });
  }
}
