// app/api/generate/audit/route.ts
// Endpoint de auditoría interna — evalúa la calidad de un VSL generado
import { NextRequest, NextResponse } from 'next/server';
import type { DatosCliente, BloqueVSL } from '@/lib/utils';
import { auditarVSL } from '@/lib/auditor';

export async function POST(req: NextRequest) {
  try {
    const { bloques, datosCliente } = await req.json() as {
      bloques: BloqueVSL[];
      datosCliente: DatosCliente;
    };

    if (!bloques || bloques.length === 0) {
      return NextResponse.json({
        exito: false,
        error: 'No hay bloques para auditar',
      }, { status: 400 });
    }

    const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;
    const resultado = await auditarVSL(bloques, datosCliente, INSFORGE_API_KEY);

    return NextResponse.json({
      exito: true,
      auditoria: resultado,
      aprobado: resultado.promedioGeneral >= 8 && resultado.bloquesDebiles.length === 0,
    });

  } catch (error) {
    console.error('[API/audit] Error:', error);
    return NextResponse.json({
      exito: false,
      error: 'Error al auditar el guion',
    }, { status: 500 });
  }
}
