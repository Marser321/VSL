// app/api/generate/regenerate/route.ts
// Regenera un bloque individual del VSL con un ángulo diferente
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import type { DatosCliente, HallazgoResearch, BloqueVSL } from '@/lib/utils';
import { buildRegeneratePrompt } from '@/lib/prompts';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { bloqueOriginal, datosCliente } = await req.json() as {
      bloqueOriginal: BloqueVSL;
      datosCliente: DatosCliente;
    };

    const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!GOOGLE_API_KEY) {
      // Modo demo: devolver el mismo bloque con texto ligeramente modificado
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        bloque: {
          ...bloqueOriginal,
          texto: `[VERSIÓN ALTERNATIVA] ${bloqueOriginal.texto}`,
          anguloUsado: `Variante alternativa de: ${bloqueOriginal.anguloUsado}`,
          justificacionEducativa: `Esta es una versión alternativa del bloque original. En modo de producción (con GOOGLE_GENERATIVE_AI_API_KEY configurada), la IA generaría un enfoque completamente diferente usando otro ángulo psicológico para maximizar la conversión.`,
        },
        nota: 'Configurá GOOGLE_GENERATIVE_AI_API_KEY para regeneración real con IA',
      });
    }

    const prompt = buildRegeneratePrompt(bloqueOriginal, datosCliente);

    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        prompt,
        schema: z.object({
          id: z.string().optional(),
          tipo: z.string().optional(),
          titulo: z.string(),
          texto: z.string(),
          logica_conversion: z.string().optional(),
          angulo_usado: z.string().optional(),
          dolor_atacado: z.string().optional(),
          justificacion_educativa: z.string().optional(),
        })
      });

      const bloqueRegenerado: BloqueVSL = {
        id: object.id || bloqueOriginal.id,
        tipo: (object.tipo || bloqueOriginal.tipo) as BloqueVSL['tipo'],
        titulo: object.titulo,
        texto: object.texto,
        logicaConversion: object.logica_conversion || '',
        anguloUsado: object.angulo_usado || '',
        dolorAtacado: object.dolor_atacado || '',
        justificacionEducativa: object.justificacion_educativa || '',
      };

      return NextResponse.json({
        exito: true,
        fuente: 'gemini_ai',
        bloque: bloqueRegenerado,
      });
    } catch (aiError) {
      console.error('[API/regenerate] AI error:', aiError);
      return NextResponse.json({
        exito: false,
        error: 'Error con Gemini AI al regenerar el bloque',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[API/regenerate] Error general:', error);
    return NextResponse.json({
      exito: false,
      error: 'Error al regenerar el bloque',
    }, { status: 500 });
  }
}
