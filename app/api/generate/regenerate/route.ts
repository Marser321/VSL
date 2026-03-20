// app/api/generate/regenerate/route.ts
// Regenera un bloque individual del VSL con un ángulo diferente
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import type { DatosCliente, HallazgoResearch, BloqueVSL } from '@/lib/utils';
import { buildRegeneratePrompt } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { bloqueOriginal, datosCliente } = await req.json() as {
      bloqueOriginal: BloqueVSL;
      datosCliente: DatosCliente;
    };

    const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;

    if (!INSFORGE_API_KEY || INSFORGE_API_KEY === 'your_insforge_api_key_here') {
      // Modo demo: devolver el mismo bloque con texto ligeramente modificado
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        bloque: {
          ...bloqueOriginal,
          texto: `[VERSIÓN ALTERNATIVA] ${bloqueOriginal.texto}`,
          anguloUsado: `Variante alternativa de: ${bloqueOriginal.anguloUsado}`,
          justificacionEducativa: `Esta es una versión alternativa del bloque original. En modo de producción (con INSFORGE_API_KEY configurada), la IA generaría un enfoque completamente diferente usando otro ángulo psicológico para maximizar la conversión.`,
        },
        nota: 'Configurá INSFORGE_API_KEY para regeneración real con IA',
      });
    }

    const prompt = buildRegeneratePrompt(bloqueOriginal, datosCliente);

    const response = await fetch('https://api.insforge.com/v1/ai/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/regenerate] Insforge error:', errorText);
      return NextResponse.json({
        exito: false,
        error: 'Error con Insforge AI al regenerar el bloque',
      }, { status: 500 });
    }

    const data = await response.json();
    const contenido = data.choices?.[0]?.message?.content || data.content || '';

    const jsonMatch = contenido.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON no encontrado en respuesta');

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalizar snake_case -> camelCase
    const bloqueRegenerado: BloqueVSL = {
      id: parsed.id || bloqueOriginal.id,
      tipo: parsed.tipo || bloqueOriginal.tipo,
      titulo: parsed.titulo,
      texto: parsed.texto,
      logicaConversion: parsed.logica_conversion || parsed.logicaConversion || '',
      anguloUsado: parsed.angulo_usado || parsed.anguloUsado || '',
      dolorAtacado: parsed.dolor_atacado || parsed.dolorAtacado || '',
      justificacionEducativa: parsed.justificacion_educativa || parsed.justificacionEducativa || '',
    };

    return NextResponse.json({
      exito: true,
      fuente: 'insforge_ai',
      bloque: bloqueRegenerado,
    });

  } catch (error) {
    console.error('[API/regenerate] Error general:', error);
    return NextResponse.json({
      exito: false,
      error: 'Error al regenerar el bloque',
    }, { status: 500 });
  }
}
